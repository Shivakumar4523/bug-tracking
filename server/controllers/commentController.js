const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Issue = require("../models/Issue");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { isAdminRole } = require("../utils/roles");

const getAccessibleIssue = async (userId, issueId) => {
  const issue = await Issue.findById(issueId);

  if (!issue) {
    return null;
  }

  const project = await Project.findOne({
    _id: issue.projectId,
    ...(isAdminRole(userId?.role)
      ? {}
      : {
          $or: [{ members: userId._id }, { owner: userId._id }],
        }),
  });

  if (!project) {
    return null;
  }

  return issue;
};

const createComment = asyncHandler(async (req, res) => {
  const { issueId, text } = req.body;

  if (!issueId || !text) {
    res.status(400);
    throw new Error("Issue and comment text are required");
  }

  if (!mongoose.isValidObjectId(issueId)) {
    res.status(400);
    throw new Error("Invalid issue id");
  }

  const issue = await getAccessibleIssue(req.user, issueId);

  if (!issue) {
    res.status(404);
    throw new Error("Issue not found or inaccessible");
  }

  const comment = await Comment.create({
    issueId,
    userId: req.user._id,
    text,
  });

  await comment.populate("userId", "name email role");

  res.status(201).json(comment);
});

const getComments = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.issueId)) {
    res.status(400);
    throw new Error("Invalid issue id");
  }

  const issue = await getAccessibleIssue(req.user, req.params.issueId);

  if (!issue) {
    res.status(404);
    throw new Error("Issue not found or inaccessible");
  }

  const comments = await Comment.find({
    issueId: req.params.issueId,
  })
    .populate("userId", "name email role")
    .sort({ createdAt: 1 });

  res.status(200).json(comments);
});

module.exports = {
  createComment,
  getComments,
};
