const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { isAdminRole } = require("../utils/roles");

const taskPopulate = [
  { path: "assignedTo", select: "name email role" },
  { path: "createdBy", select: "name email role" },
];

const taskSort = { dueDate: 1, createdAt: -1 };

const normalizeTask = (task) => ({
  ...task,
  assignedTo: task.assignedTo
    ? {
        ...task.assignedTo,
        role: isAdminRole(task.assignedTo.role) ? "Admin" : "User",
      }
    : null,
  createdBy: task.createdBy
    ? {
        ...task.createdBy,
        role: isAdminRole(task.createdBy.role) ? "Admin" : "User",
      }
    : null,
});

const buildSearchRegex = (value = "") => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const badRequestError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const ensureValidUser = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    return null;
  }

  return User.findById(userId).select("_id");
};

const buildTaskQuery = async (req, scopedUserId = null) => {
  const query = {};

  if (scopedUserId) {
    query.assignedTo = scopedUserId;
  } else if (req.query.assignedTo && req.query.assignedTo !== "all") {
    if (req.query.assignedTo === "unassigned") {
      query.assignedTo = null;
    } else if (mongoose.isValidObjectId(req.query.assignedTo)) {
      query.assignedTo = req.query.assignedTo;
    } else {
      throw badRequestError("Invalid assigned user filter");
    }
  }

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  if (req.query.priority && req.query.priority !== "all") {
    query.priority = req.query.priority;
  }

  if (req.query.search) {
    const pattern = buildSearchRegex(req.query.search.trim());
    query.$or = [{ title: pattern }, { description: pattern }];
  }

  return query;
};

const getTasks = asyncHandler(async (req, res) => {
  const query = await buildTaskQuery(req);
  const tasks = await Task.find(query)
    .populate(taskPopulate)
    .sort(taskSort)
    .lean();

  res.status(200).json(tasks.map(normalizeTask));
});

const getMyTasks = asyncHandler(async (req, res) => {
  const query = await buildTaskQuery(req, req.user._id);
  const tasks = await Task.find(query)
    .populate(taskPopulate)
    .sort(taskSort)
    .lean();

  res.status(200).json(tasks.map(normalizeTask));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, assignedTo, dueDate } = req.body;

  if (!title) {
    res.status(400);
    throw new Error("Task title is required");
  }

  let assignee = null;

  if (assignedTo) {
    assignee = await ensureValidUser(assignedTo);
  }

  if (assignedTo && !assignee) {
    res.status(400);
    throw new Error("Assigned user is invalid");
  }

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    assignedTo: assignee?._id || null,
    createdBy: req.user._id,
    dueDate: dueDate || null,
  });

  await task.populate(taskPopulate);

  res.status(201).json(normalizeTask(task.toObject()));
});

const createIssue = asyncHandler(async (req, res) => {
  const { title, description, priority } = req.body;

  if (!title) {
    res.status(400);
    throw new Error("Issue title is required");
  }

  const task = await Task.create({
    title,
    description,
    priority,
    assignedTo: req.user._id,
    createdBy: req.user._id,
    status: "open",
  });

  await task.populate(taskPopulate);

  res.status(201).json(normalizeTask(task.toObject()));
});

const updateTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid task id");
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const adminRequest = isAdminRole(req.user.role);
  const isAssignedUser =
    task.assignedTo && String(task.assignedTo) === String(req.user._id);

  if (!adminRequest && !isAssignedUser) {
    res.status(403);
    throw new Error("You are not allowed to update this task");
  }

  if (adminRequest) {
    const updatableFields = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
    ];

    updatableFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        task[field] = req.body[field];
      }
    });

    if (typeof req.body.assignedTo !== "undefined") {
      if (!req.body.assignedTo) {
        task.assignedTo = null;
      } else {
        const assignee = await ensureValidUser(req.body.assignedTo);

        if (!assignee) {
          res.status(400);
          throw new Error("Assigned user is invalid");
        }

        task.assignedTo = assignee._id;
      }
    }
  } else {
    if (typeof req.body.status === "undefined") {
      res.status(400);
      throw new Error("Only task status can be updated from this view");
    }

    task.status = req.body.status;
  }

  await task.save();
  await task.populate(taskPopulate);

  res.status(200).json(normalizeTask(task.toObject()));
});

const deleteTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid task id");
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  await task.deleteOne();

  res.status(200).json({
    message: "Task deleted successfully",
    id: req.params.id,
  });
});

module.exports = {
  getTasks,
  getMyTasks,
  createTask,
  createIssue,
  updateTask,
  deleteTask,
};
