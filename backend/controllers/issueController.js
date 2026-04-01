const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Issue = require("../models/Issue");
const Project = require("../models/Project");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { isAdminRole } = require("../utils/roles");

const issuePopulate = [
  { path: "assignee", select: "name email role" },
  { path: "reporter", select: "name email role" },
  { path: "projectId", select: "name key description members owner startDate endDate" },
];

const buildAccessibleProjectQuery = (user) =>
  isAdminRole(user?.role)
    ? {}
    : {
        $or: [{ members: user._id }, { owner: user._id }],
      };

const getAccessibleProjectIds = async (user) =>
  Project.find(buildAccessibleProjectQuery(user)).distinct("_id");

const isProjectMember = (project, userId) =>
  project.members.some((memberId) => String(memberId) === String(userId));

const hasProjectAccess = (project, userId) =>
  String(project.owner) === String(userId) || isProjectMember(project, userId);

const loadAccessibleProject = async (user, projectId) =>
  Project.findOne({
    _id: projectId,
    ...buildAccessibleProjectQuery(user),
  });

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeIssueStatus = (value = "") => {
  const normalizedValue = String(value).trim().toLowerCase();

  if (["todo", "to-do", "to do", "backlog", "open"].includes(normalizedValue)) {
    return "todo";
  }

  if (["inprogress", "in-progress", "in progress", "doing", "active sprint"].includes(normalizedValue)) {
    return "inprogress";
  }

  if (["done", "closed", "resolved", "completed", "complete"].includes(normalizedValue)) {
    return "done";
  }

  return "";
};

const normalizeIssuePriority = (value = "") => {
  const normalizedValue = String(value).trim().toLowerCase();

  if (normalizedValue === "low") {
    return "Low";
  }

  if (normalizedValue === "medium" || normalizedValue === "med") {
    return "Medium";
  }

  if (normalizedValue === "high") {
    return "High";
  }

  return "";
};

const normalizeIssueType = (value = "") => {
  const normalizedValue = String(value).trim().toLowerCase();

  if (normalizedValue === "bug") {
    return "Bug";
  }

  if (normalizedValue === "task") {
    return "Task";
  }

  if (normalizedValue === "story") {
    return "Story";
  }

  return "";
};

const buildIssueImportSummary = ({ importedIssues = [], invalidRows = [] }) => ({
  message: importedIssues.length
    ? `Imported ${importedIssues.length} issue${importedIssues.length === 1 ? "" : "s"}.`
    : "No issues were imported.",
  importedCount: importedIssues.length,
  skippedCount: invalidRows.length,
  importedIssues,
  invalidRows: invalidRows.sort((left, right) => left.rowNumber - right.rowNumber),
});

const getIssues = asyncHandler(async (req, res) => {
  const accessibleProjectIds = await getAccessibleProjectIds(req.user);
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

    const hasRequestedProjectAccess = accessibleProjectIds.some(
      (projectId) => String(projectId) === String(req.query.projectId)
    );

    if (!hasRequestedProjectAccess) {
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

  if (req.query.search) {
    const searchPattern = new RegExp(escapeRegex(req.query.search.trim()), "i");
    query.$or = [
      { title: searchPattern },
      { description: searchPattern },
      { type: searchPattern },
    ];
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

  const project = await loadAccessibleProject(req.user, projectId);

  if (!project) {
    res.status(403);
    throw new Error("You do not have access to that project");
  }

  if (assignee) {
    if (!mongoose.isValidObjectId(assignee)) {
      res.status(400);
      throw new Error("Invalid assignee id");
    }

    if (!hasProjectAccess(project, assignee)) {
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

  let targetProject = await loadAccessibleProject(req.user, issue.projectId);

  if (!targetProject) {
    res.status(403);
    throw new Error("You do not have access to this issue");
  }

  if (req.body.projectId) {
    if (!mongoose.isValidObjectId(req.body.projectId)) {
      res.status(400);
      throw new Error("Invalid project id");
    }

    targetProject = await loadAccessibleProject(req.user, req.body.projectId);

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

      if (!hasProjectAccess(targetProject, req.body.assignee)) {
        res.status(400);
        throw new Error("Assignee must be a member of the selected project");
      }

      issue.assignee = req.body.assignee;
    }
  } else if (issue.assignee && !hasProjectAccess(targetProject, issue.assignee)) {
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

  const project = await loadAccessibleProject(req.user, issue.projectId);

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

const importIssues = asyncHandler(async (req, res) => {
  const incomingRows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  const { projectId } = req.body || {};

  if (!projectId || !mongoose.isValidObjectId(projectId)) {
    res.status(400);
    throw new Error("A valid project is required");
  }

  if (!incomingRows) {
    res.status(400);
    throw new Error("A rows array is required");
  }

  const project = await Project.findById(projectId)
    .populate("members", "name email")
    .populate("owner", "name email");

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const assignableUsers = [...(project.members || [])];

  if (
    project.owner &&
    !assignableUsers.some((user) => String(user._id) === String(project.owner._id))
  ) {
    assignableUsers.push(project.owner);
  }

  const assignableByEmail = new Map(
    assignableUsers.map((user) => [String(user.email).toLowerCase(), user])
  );

  const invalidRows = [];
  const recordsToCreate = [];

  incomingRows.forEach((row, index) => {
    const rowNumber = Number(row?.rowNumber) || index + 2;
    const title = String(row?.title || "").trim();
    const description = String(row?.description || "").trim();
    const status = normalizeIssueStatus(row?.status || "todo") || "todo";
    const priority = normalizeIssuePriority(row?.priority || "Medium") || "Medium";
    const type = normalizeIssueType(row?.type || "Task") || "Task";
    const assigneeEmail = String(row?.assigneeEmail || "").trim().toLowerCase();
    const dueDate = row?.dueDate ? new Date(row.dueDate) : null;

    if (!title) {
      invalidRows.push({
        rowNumber,
        title,
        reason: "Issue title is required",
      });
      return;
    }

    if (row?.status && !normalizeIssueStatus(row.status)) {
      invalidRows.push({
        rowNumber,
        title,
        reason: "Issue status must map to To Do, In Progress, or Done",
      });
      return;
    }

    if (row?.priority && !normalizeIssuePriority(row.priority)) {
      invalidRows.push({
        rowNumber,
        title,
        reason: "Issue priority must map to Low, Medium, or High",
      });
      return;
    }

    if (row?.type && !normalizeIssueType(row.type)) {
      invalidRows.push({
        rowNumber,
        title,
        reason: "Issue type must map to Bug, Task, or Story",
      });
      return;
    }

    if (row?.dueDate && Number.isNaN(dueDate?.getTime())) {
      invalidRows.push({
        rowNumber,
        title,
        reason: "Due date must be a valid date value",
      });
      return;
    }

    let assignee = null;

    if (assigneeEmail) {
      assignee = assignableByEmail.get(assigneeEmail) || null;

      if (!assignee) {
        invalidRows.push({
          rowNumber,
          title,
          reason: "Assignee email must belong to a selected project member",
        });
        return;
      }
    }

    recordsToCreate.push({
      rowNumber,
      title,
      description,
      status,
      priority,
      type,
      dueDate,
      assignee: assignee?._id || null,
    });
  });

  if (!recordsToCreate.length) {
    res.status(200).json(
      buildIssueImportSummary({
        importedIssues: [],
        invalidRows,
      })
    );
    return;
  }

  const insertedIssues = await Issue.insertMany(
    recordsToCreate.map((record) => ({
      title: record.title,
      description: record.description,
      type: record.type,
      status: record.status,
      priority: record.priority,
      dueDate: record.dueDate,
      assignee: record.assignee,
      reporter: req.user._id,
      projectId: project._id,
    }))
  );

  const populatedIssues = await Issue.find({
    _id: { $in: insertedIssues.map((issue) => issue._id) },
  })
    .populate(issuePopulate)
    .sort({ createdAt: -1 });

  const summary = buildIssueImportSummary({
    importedIssues: populatedIssues,
    invalidRows,
  });

  res.status(populatedIssues.length ? 201 : 200).json(summary);
});

module.exports = {
  getIssues,
  createIssue,
  importIssues,
  updateIssue,
  deleteIssue,
};
