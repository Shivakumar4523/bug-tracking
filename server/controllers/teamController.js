const mongoose = require("mongoose");
const Project = require("../models/Project");
const Team = require("../models/Team");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { isAdminRole, normalizeRole } = require("../utils/roles");

const serializeTeamUser = (user) =>
  user
    ? {
        ...user,
        role: normalizeRole(user.role),
      }
    : null;

const serializeTeam = (team) => ({
  ...team,
  users: (team.users || []).map(serializeTeamUser),
  createdBy: serializeTeamUser(team.createdBy),
  projectId: team.projectId
    ? {
        ...team.projectId,
        owner: serializeTeamUser(team.projectId.owner),
      }
    : null,
});

const getTeams = asyncHandler(async (req, res) => {
  const query = isAdminRole(req.user.role) ? {} : { users: req.user._id };

  const teams = await Team.find(query)
    .populate("users", "name email role")
    .populate("createdBy", "name email role")
    .populate("projectId", "name key startDate endDate owner")
    .populate({
      path: "projectId",
      populate: {
        path: "owner",
        select: "name email role",
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(teams.map(serializeTeam));
});

const createTeam = asyncHandler(async (req, res) => {
  const { name, userIds = [], projectId } = req.body;
  const trimmedName = name?.trim();

  if (!trimmedName) {
    res.status(400);
    throw new Error("Team name is required");
  }

  if (!projectId || !mongoose.isValidObjectId(projectId)) {
    res.status(400);
    throw new Error("A valid project is required");
  }

  const uniqueUserIds = [
    ...new Set(userIds.filter((id) => mongoose.isValidObjectId(id))),
  ];

  if (!uniqueUserIds.length) {
    res.status(400);
    throw new Error("Select at least one user for this team");
  }

  const project = await Project.findById(projectId);

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const users = await User.find({
    _id: { $in: uniqueUserIds },
  }).select("_id");

  if (!users.length) {
    res.status(400);
    throw new Error("No valid users were selected");
  }

  const resolvedUserIds = users.map((user) => user._id.toString());
  const mergedProjectMembers = new Set([
    ...(project.members || []).map((memberId) => memberId.toString()),
    ...resolvedUserIds,
  ]);

  project.members = Array.from(mergedProjectMembers);
  await project.save();

  const team = await Team.create({
    name: trimmedName,
    users: resolvedUserIds,
    projectId: project._id,
    createdBy: req.user._id,
  });

  const populatedTeam = await Team.findById(team._id)
    .populate("users", "name email role")
    .populate("createdBy", "name email role")
    .populate("projectId", "name key startDate endDate owner")
    .populate({
      path: "projectId",
      populate: {
        path: "owner",
        select: "name email role",
      },
    })
    .lean();

  res.status(201).json(serializeTeam(populatedTeam));
});

module.exports = {
  getTeams,
  createTeam,
};
