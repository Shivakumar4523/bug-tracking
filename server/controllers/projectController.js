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

const resolveProjectMemberIds = async (memberIds = [], ownerId) => {
  const requestedMemberIds = [
    ...new Set(memberIds.filter(Boolean).filter((id) => mongoose.isValidObjectId(id))),
  ];

  if (ownerId && mongoose.isValidObjectId(ownerId)) {
    requestedMemberIds.push(String(ownerId));
  }

  const uniqueMemberIds = [...new Set(requestedMemberIds)];

  const members = await User.find({
    _id: { $in: uniqueMemberIds },
  }).select("_id");

  return members.map((member) => member._id);
};

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

  const members = await resolveProjectMemberIds(memberIds, req.user._id);

  const project = await Project.create({
    name: trimmedName,
    key: normalizedKey,
    description: description?.trim() || "",
    startDate: startDate || null,
    endDate: endDate || null,
    owner: req.user._id,
    members,
  });

  const populatedProject = await Project.findById(project._id)
    .populate("owner", "name email role")
    .populate("members", "name email role")
    .lean();

  res.status(201).json(serializeProject(populatedProject));
});

const updateProject = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid project id");
  }

  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const nextName = typeof req.body.name === "string" ? req.body.name.trim() : project.name;
  const nextKey =
    typeof req.body.key === "string" ? req.body.key.trim().toUpperCase() : project.key;
  const nextDescription =
    typeof req.body.description === "string"
      ? req.body.description.trim()
      : project.description || "";
  const nextStartDate =
    typeof req.body.startDate !== "undefined" ? req.body.startDate || null : project.startDate;
  const nextEndDate =
    typeof req.body.endDate !== "undefined" ? req.body.endDate || null : project.endDate;

  if (!nextName) {
    res.status(400);
    throw new Error("Project name is required");
  }

  if (!nextKey) {
    res.status(400);
    throw new Error("Project key is required");
  }

  if (!PROJECT_KEY_PATTERN.test(nextKey)) {
    res.status(400);
    throw new Error("Project key must be 2-12 characters using letters, numbers, or hyphens");
  }

  if (nextStartDate && nextEndDate && new Date(nextEndDate) < new Date(nextStartDate)) {
    res.status(400);
    throw new Error("End date cannot be before the start date");
  }

  const existingProject = await Project.findOne({
    key: nextKey,
    _id: { $ne: project._id },
  }).select("_id");

  if (existingProject) {
    res.status(409);
    throw new Error("A project with that key already exists");
  }

  if (Array.isArray(req.body.memberIds)) {
    project.members = await resolveProjectMemberIds(req.body.memberIds, project.owner);
  }

  project.name = nextName;
  project.key = nextKey;
  project.description = nextDescription;
  project.startDate = nextStartDate;
  project.endDate = nextEndDate;

  await project.save();

  const [populatedProject, issueCount] = await Promise.all([
    Project.findById(project._id)
      .populate("owner", "name email role")
      .populate("members", "name email role")
      .lean(),
    Issue.countDocuments({ projectId: project._id }),
  ]);

  res.status(200).json(
    serializeProject(populatedProject, new Map([[String(project._id), issueCount]]))
  );
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
  updateProject,
  deleteProject,
};
