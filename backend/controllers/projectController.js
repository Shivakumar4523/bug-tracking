const mongoose = require("mongoose");
const Issue = require("../models/Issue");
const Project = require("../models/Project");
const Team = require("../models/Team");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { isAdminRole, normalizeRole } = require("../utils/roles");

const PROJECT_KEY_PATTERN = /^[A-Z0-9-]{2,12}$/;

const normalizeProjectUser = (user) =>
  user
    ? {
        ...user,
        role: normalizeRole(user.role),
      }
    : null;

const serializeProject = (project, issueCountMap = new Map()) => ({
  ...project,
  owner: normalizeProjectUser(project.owner),
  members: (project.members || []).map(normalizeProjectUser),
  issueCount: issueCountMap.get(String(project._id)) || 0,
});

const getProjects = asyncHandler(async (req, res) => {
  const query = isAdminRole(req.user.role)
    ? {}
    : {
        $or: [{ members: req.user._id }, { owner: req.user._id }],
      };

  const projects = await Project.find(query)
    .populate("owner", "name email role")
    .populate("members", "name email role")
    .sort({ createdAt: -1 })
    .lean();

  const issueCounts = await Issue.aggregate([
    {
      $match: {
        projectId: {
          $in: projects.map((project) => project._id),
        },
      },
    },
    {
      $group: {
        _id: "$projectId",
        count: { $sum: 1 },
      },
    },
  ]);

  const issueCountMap = new Map(
    issueCounts.map((item) => [String(item._id), item.count])
  );

  res.status(200).json(
    projects.map((project) => serializeProject(project, issueCountMap))
  );
});

const createProject = asyncHandler(async (req, res) => {
  const { name, key, description, memberIds = [], startDate, endDate } = req.body;
  const trimmedName = name?.trim();
  const normalizedKey = key?.trim().toUpperCase();

  if (!trimmedName) {
    res.status(400);
    throw new Error("Project name is required");
  }

  if (!normalizedKey) {
    res.status(400);
    throw new Error("Project key is required");
  }

  if (!PROJECT_KEY_PATTERN.test(normalizedKey)) {
    res.status(400);
    throw new Error("Project key must be 2-12 characters using letters, numbers, or hyphens");
  }

  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    res.status(400);
    throw new Error("End date cannot be before the start date");
  }

  const existingProject = await Project.findOne({ key: normalizedKey }).select("_id");

  if (existingProject) {
    res.status(409);
    throw new Error("A project with that key already exists");
  }

  const requestedMemberIds = [
    ...new Set(
      memberIds
        .filter(Boolean)
        .filter((id) => mongoose.isValidObjectId(id))
    ),
  ];

  const members = await User.find({
    _id: { $in: requestedMemberIds },
  }).select("_id");

  const project = await Project.create({
    name: trimmedName,
    key: normalizedKey,
    description: description?.trim() || "",
    startDate: startDate || null,
    endDate: endDate || null,
    owner: req.user._id,
    members: members.map((member) => member._id),
  });

  const populatedProject = await Project.findById(project._id)
    .populate("owner", "name email role")
    .populate("members", "name email role")
    .lean();

  res.status(201).json(serializeProject(populatedProject));
});

const deleteProject = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid project id");
  }

  const project = await Project.findById(req.params.id).select("_id name");

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const [deletedTeamsResult, deletedIssuesResult] = await Promise.all([
    Team.deleteMany({ projectId: project._id }),
    Issue.deleteMany({ projectId: project._id }),
  ]);

  await project.deleteOne();

  res.status(200).json({
    message: "Project deleted successfully",
    id: req.params.id,
    name: project.name,
    deletedTeamsCount: deletedTeamsResult.deletedCount || 0,
    deletedIssuesCount: deletedIssuesResult.deletedCount || 0,
  });
});

module.exports = {
  getProjects,
  createProject,
  deleteProject,
};
