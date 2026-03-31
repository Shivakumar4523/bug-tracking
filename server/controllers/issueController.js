const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Issue = require("../models/Issue");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");

const issuePopulate = [
  { path: "assignee", select: "name email role" },
  { path: "reporter", select: "name email role" },
  { path: "projectId", select: "name description members" },
];

const getAccessibleProjectIds = async (userId) =>
  Project.find({ members: userId }).distinct("_id");

const isMemberOfProject = (project, userId) =>
  project.members.some((memberId) => String(memberId) === String(userId));

const loadAccessibleProject = async (userId, projectId) =>
  Project.findOne({
    _id: projectId,
    members: userId,
  });

const getIssues = asyncHandler(async (req, res) => {
  const accessibleProjectIds = await getAccessibleProjectIds(req.user._id);
  const query = {
    projectId: {
      $in: accessibleProjectIds,
    },
  };

  if (req.query.projectId && req.query.projectId !== "all") {
    if (!mongoose.isValidObjectId(req.query.projectId)) {
      res.status(400);
      throw new Error("Invalid project id filter");
    }

    const hasProjectAccess = accessibleProjectIds.some(
      (projectId) => String(projectId) === String(req.query.projectId)
    );

    if (!hasProjectAccess) {
      res.status(403);
      throw new Error("You do not have access to that project");
    }

    query.projectId = req.query.projectId;
  }

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  if (req.query.priority && req.query.priority !== "all") {
    query.priority = req.query.priority;
  }

  if (req.query.assignee && req.query.assignee !== "all") {
    if (!mongoose.isValidObjectId(req.query.assignee)) {
      res.status(400);
      throw new Error("Invalid assignee filter");
    }

    query.assignee = req.query.assignee;
  }

  const issues = await Issue.find(query)
    .populate(issuePopulate)
    .sort({ createdAt: -1 });

  res.status(200).json(issues);
});

const createIssue = asyncHandler(async (req, res) => {
  const { title, description, type, status, priority, dueDate, assignee, projectId } =
    req.body;

  if (!title || !projectId) {
    res.status(400);
    throw new Error("Issue title and project are required");
  }

  if (!mongoose.isValidObjectId(projectId)) {
    res.status(400);
    throw new Error("Invalid project id");
  }

  const project = await loadAccessibleProject(req.user._id, projectId);

  if (!project) {
    res.status(403);
    throw new Error("You do not have access to that project");
  }

  if (assignee) {
    if (!mongoose.isValidObjectId(assignee)) {
      res.status(400);
      throw new Error("Invalid assignee id");
    }

    if (!isMemberOfProject(project, assignee)) {
      res.status(400);
      throw new Error("Assignee must be a member of the selected project");
    }
  }

  const issue = await Issue.create({
    title,
    description,
    type,
    status,
    priority,
    dueDate: dueDate || null,
    assignee: assignee || null,
    reporter: req.user._id,
    projectId,
  });

  await issue.populate(issuePopulate);

  res.status(201).json(issue);
});

const updateIssue = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid issue id");
  }

  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    res.status(404);
    throw new Error("Issue not found");
  }

  let targetProject = await loadAccessibleProject(req.user._id, issue.projectId);

  if (!targetProject) {
    res.status(403);
    throw new Error("You do not have access to this issue");
  }

  if (req.body.projectId) {
    if (!mongoose.isValidObjectId(req.body.projectId)) {
      res.status(400);
      throw new Error("Invalid project id");
    }

    targetProject = await loadAccessibleProject(req.user._id, req.body.projectId);

    if (!targetProject) {
      res.status(403);
      throw new Error("You do not have access to the target project");
    }

    issue.projectId = targetProject._id;
  }

  const updatableFields = [
    "title",
    "description",
    "type",
    "status",
    "priority",
    "dueDate",
  ];

  updatableFields.forEach((field) => {
    if (typeof req.body[field] !== "undefined") {
      issue[field] = req.body[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(req.body, "assignee")) {
    if (!req.body.assignee) {
      issue.assignee = null;
    } else {
      if (!mongoose.isValidObjectId(req.body.assignee)) {
        res.status(400);
        throw new Error("Invalid assignee id");
      }

      if (!isMemberOfProject(targetProject, req.body.assignee)) {
        res.status(400);
        throw new Error("Assignee must be a member of the selected project");
      }

      issue.assignee = req.body.assignee;
    }
  } else if (issue.assignee && !isMemberOfProject(targetProject, issue.assignee)) {
    issue.assignee = null;
  }

  await issue.save();
  await issue.populate(issuePopulate);

  res.status(200).json(issue);
});

const deleteIssue = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid issue id");
  }

  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    res.status(404);
    throw new Error("Issue not found");
  }

  const project = await loadAccessibleProject(req.user._id, issue.projectId);

  if (!project) {
    res.status(403);
    throw new Error("You do not have access to this issue");
  }

  await Comment.deleteMany({ issueId: issue._id });
  await issue.deleteOne();

  res.status(200).json({
    message: "Issue deleted successfully",
  });
});

module.exports = {
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue,
};
