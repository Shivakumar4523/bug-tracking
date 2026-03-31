const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Issue = require("../models/Issue");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Team = require("../models/Team");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { isAdminRole, normalizeRole, USER_ROLE } = require("../utils/roles");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const DEFAULT_BULK_IMPORT_PASSWORD = "Pirnav@123";

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
  createdAt: user.createdAt,
});

const buildBulkImportSummary = ({
  importedUsers = [],
  invalidRows = [],
}) => ({
  message: importedUsers.length
    ? `Imported ${importedUsers.length} user${importedUsers.length === 1 ? "" : "s"}.`
    : "No users were imported.",
  importedCount: importedUsers.length,
  skippedCount: invalidRows.length,
  importedUsers,
  invalidRows,
  temporaryPassword: DEFAULT_BULK_IMPORT_PASSWORD,
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("name email role createdAt")
    .sort({ createdAt: 1 })
    .lean();

  res.status(200).json(users.map(serializeUser));
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email?.toLowerCase().trim();

  if (!name?.trim() || !normalizedEmail || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    res.status(409);
    throw new Error("An account with that email already exists");
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: USER_ROLE,
  });

  res.status(201).json(serializeUser(user));
});

const bulkImportUsers = asyncHandler(async (req, res) => {
  const incomingUsers = Array.isArray(req.body) ? req.body : req.body?.users;

  if (!Array.isArray(incomingUsers)) {
    res.status(400);
    throw new Error("A users array is required");
  }

  const invalidRows = [];
  const uniqueCandidates = [];
  const seenEmails = new Set();

  incomingUsers.forEach((entry, index) => {
    const rowNumber = Number(entry?.rowNumber) || index + 2;
    const name = String(entry?.name || entry?.fullName || entry?.["Full Name"] || "")
      .trim();
    const email = String(entry?.email || entry?.["Email Address"] || "")
      .trim()
      .toLowerCase();

    if (!name || !email) {
      invalidRows.push({
        rowNumber,
        name,
        email,
        reason: "Full name and email are required",
      });
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      invalidRows.push({
        rowNumber,
        name,
        email,
        reason: "Invalid email format",
      });
      return;
    }

    if (seenEmails.has(email)) {
      invalidRows.push({
        rowNumber,
        name,
        email,
        reason: "Duplicate email in uploaded file",
      });
      return;
    }

    seenEmails.add(email);
    uniqueCandidates.push({
      rowNumber,
      name,
      email,
    });
  });

  if (!uniqueCandidates.length) {
    res.status(200).json(
      buildBulkImportSummary({
        importedUsers: [],
        invalidRows,
      })
    );
    return;
  }

  const existingUsers = await User.find({
    email: { $in: uniqueCandidates.map((user) => user.email) },
  })
    .select("email")
    .lean();

  const existingEmails = new Set(existingUsers.map((user) => user.email.toLowerCase()));
  const recordsToCreate = [];

  uniqueCandidates.forEach((candidate) => {
    if (existingEmails.has(candidate.email)) {
      invalidRows.push({
        ...candidate,
        reason: "Email already exists",
      });
      return;
    }

    recordsToCreate.push(candidate);
  });

  const importedUsers = [];

  for (const candidate of recordsToCreate) {
    try {
      const user = await User.create({
        name: candidate.name,
        email: candidate.email,
        password: DEFAULT_BULK_IMPORT_PASSWORD,
        role: USER_ROLE,
      });

      importedUsers.push(serializeUser(user));
    } catch (error) {
      invalidRows.push({
        ...candidate,
        reason:
          error.code === 11000
            ? "Email already exists"
            : error.message || "Unable to import this row",
      });
    }
  }

  const summary = buildBulkImportSummary({
    importedUsers,
    invalidRows: invalidRows.sort((left, right) => left.rowNumber - right.rowNumber),
  });

  res.status(importedUsers.length ? 201 : 200).json(summary);
});

const deleteUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  if (String(req.user._id) === String(req.params.id)) {
    res.status(400);
    throw new Error("You cannot remove your own account");
  }

  const user = await User.findById(req.params.id).select("name email role");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (isAdminRole(user.role)) {
    res.status(403);
    throw new Error("Admin accounts cannot be removed from this view");
  }

  const affectedTeams = await Team.find({ users: user._id }).select("_id").lean();

  const [
    unassignedTasksResult,
    reassignedTasksResult,
    updatedProjectsResult,
    updatedTeamsResult,
    updatedIssueAssigneesResult,
    updatedIssueReportersResult,
    updatedCommentsResult,
  ] = await Promise.all([
    Task.updateMany({ assignedTo: user._id }, { $set: { assignedTo: null } }),
    Task.updateMany({ createdBy: user._id }, { $set: { createdBy: req.user._id } }),
    Project.updateMany({ members: user._id }, { $pull: { members: user._id } }),
    Team.updateMany({ users: user._id }, { $pull: { users: user._id } }),
    Issue.updateMany({ assignee: user._id }, { $set: { assignee: null } }),
    Issue.updateMany({ reporter: user._id }, { $set: { reporter: req.user._id } }),
    Comment.updateMany({ userId: user._id }, { $set: { userId: req.user._id } }),
  ]);

  let deletedEmptyTeamsCount = 0;

  if (affectedTeams.length) {
    const affectedTeamIds = affectedTeams.map((team) => team._id);
    const emptyTeams = await Team.find({
      _id: { $in: affectedTeamIds },
      users: { $size: 0 },
    })
      .select("_id")
      .lean();

    if (emptyTeams.length) {
      const deleteResult = await Team.deleteMany({
        _id: { $in: emptyTeams.map((team) => team._id) },
      });
      deletedEmptyTeamsCount = deleteResult.deletedCount || 0;
    }
  }

  await user.deleteOne();

  res.status(200).json({
    message: "User removed successfully",
    id: req.params.id,
    name: user.name,
    unassignedTasksCount: unassignedTasksResult.modifiedCount || 0,
    reassignedCreatedTasksCount: reassignedTasksResult.modifiedCount || 0,
    removedFromProjectsCount: updatedProjectsResult.modifiedCount || 0,
    updatedTeamsCount: updatedTeamsResult.modifiedCount || 0,
    deletedEmptyTeamsCount,
    clearedIssueAssignmentsCount: updatedIssueAssigneesResult.modifiedCount || 0,
    reassignedReportedIssuesCount: updatedIssueReportersResult.modifiedCount || 0,
    reassignedCommentsCount: updatedCommentsResult.modifiedCount || 0,
  });
});

module.exports = {
  getUsers,
  createUser,
  bulkImportUsers,
  deleteUser,
};
