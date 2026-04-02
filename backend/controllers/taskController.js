const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { isAdminRole } = require("../utils/roles");

const TASK_STATUS_VALUES = ["open", "in-progress", "review", "closed"];
const TASK_PRIORITY_VALUES = ["low", "medium", "high"];
const TASK_TYPE_VALUES = ["task", "bug", "story", "epic"];
const TASK_LINK_RELATION_VALUES = ["blocks", "relates-to", "duplicates", "is-blocked-by"];

const taskListPopulate = [
  { path: "assignedTo", select: "name email role" },
  { path: "createdBy", select: "name email role" },
  { path: "watchers", select: "name email role" },
  { path: "links.taskId", select: "title type status priority" },
];

const taskDetailPopulate = [
  ...taskListPopulate,
  { path: "comments.userId", select: "name email role" },
  { path: "workLogs.userId", select: "name email role" },
  { path: "attachments.uploadedBy", select: "name email role" },
  { path: "activity.userId", select: "name email role" },
];

const taskSort = { dueDate: 1, createdAt: -1 };

const STATUS_LABELS = {
  open: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  closed: "Done",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const TYPE_LABELS = {
  task: "Task",
  bug: "Bug",
  story: "Story",
  epic: "Epic",
};

const LINK_LABELS = {
  blocks: "Blocks",
  "relates-to": "Relates To",
  duplicates: "Duplicates",
  "is-blocked-by": "Is Blocked By",
};

const buildSearchRegex = (value = "") => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const badRequestError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

const toPlain = (value) => (typeof value?.toObject === "function" ? value.toObject() : value);

const normalizeTaskStatus = (value = "open") => {
  if (value === "todo") {
    return "open";
  }

  if (value === "inprogress") {
    return "in-progress";
  }

  if (value === "done") {
    return "closed";
  }

  return TASK_STATUS_VALUES.includes(value) ? value : "open";
};

const normalizeTaskPriority = (value = "medium") => {
  const normalized = String(value || "medium").trim().toLowerCase();
  return TASK_PRIORITY_VALUES.includes(normalized) ? normalized : "medium";
};

const normalizeTaskType = (value = "task") => {
  const normalized = String(value || "task").trim().toLowerCase();
  return TASK_TYPE_VALUES.includes(normalized) ? normalized : "task";
};

const normalizeRelationType = (value = "relates-to") =>
  TASK_LINK_RELATION_VALUES.includes(value) ? value : "relates-to";

const normalizeTaskUser = (user) => {
  const nextUser = toPlain(user);

  return nextUser
    ? {
        ...nextUser,
        role: isAdminRole(nextUser.role) ? "Admin" : "User",
      }
    : null;
};

const normalizeStringList = (values = []) =>
  [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean))];

const normalizeHoursValue = (value, label) => {
  if (value === null || value === "" || typeof value === "undefined") {
    return 0;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw badRequestError(`${label} must be a non-negative number`);
  }

  return parsed;
};

const normalizeDateValue = (value, label) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw badRequestError(`${label} is invalid`);
  }

  return parsed;
};

const extractMentions = (text = "") =>
  [...new Set(Array.from(String(text).matchAll(/@([A-Za-z0-9._-]+)/g)).map((match) => match[1]))];

const sortIds = (values = []) => [...values].map(String).sort();

const idsChanged = (left = [], right = []) =>
  JSON.stringify(sortIds(left)) !== JSON.stringify(sortIds(right));

const stringListsChanged = (left = [], right = []) =>
  JSON.stringify([...left].sort()) !== JSON.stringify([...right].sort());

const arraysOfObjectsChanged = (left = [], right = []) =>
  JSON.stringify(left) !== JSON.stringify(right);

const getStatusLabel = (status) => STATUS_LABELS[normalizeTaskStatus(status)] || "To Do";
const getPriorityLabel = (priority) => PRIORITY_LABELS[normalizeTaskPriority(priority)] || "Medium";
const getTypeLabel = (type) => TYPE_LABELS[normalizeTaskType(type)] || "Task";
const getRelationLabel = (relationType) => LINK_LABELS[normalizeRelationType(relationType)] || "Relates To";

const serializeLinkedTask = (link) => {
  const nextLink = toPlain(link);

  return nextLink
    ? {
        ...nextLink,
        relationType: normalizeRelationType(nextLink.relationType),
        relationLabel: getRelationLabel(nextLink.relationType),
        taskId: nextLink.taskId
          ? {
              ...toPlain(nextLink.taskId),
              type: normalizeTaskType(nextLink.taskId.type),
              status: normalizeTaskStatus(nextLink.taskId.status),
              priority: normalizeTaskPriority(nextLink.taskId.priority),
            }
          : null,
      }
    : null;
};

const normalizeTask = (task) => {
  const nextTask = toPlain(task);

  return {
    ...nextTask,
    type: normalizeTaskType(nextTask.type),
    status: normalizeTaskStatus(nextTask.status),
    priority: normalizeTaskPriority(nextTask.priority),
    assignedTo: normalizeTaskUser(nextTask.assignedTo),
    createdBy: normalizeTaskUser(nextTask.createdBy),
    watchers: (nextTask.watchers || []).map(normalizeTaskUser),
    links: (nextTask.links || []).map(serializeLinkedTask).filter(Boolean),
    comments: (nextTask.comments || []).map((comment) => ({
      ...comment,
      userId: normalizeTaskUser(comment.userId),
      mentions: normalizeStringList(comment.mentions),
    })),
    workLogs: (nextTask.workLogs || []).map((entry) => ({
      ...entry,
      userId: normalizeTaskUser(entry.userId),
    })),
    attachments: (nextTask.attachments || []).map((attachment) => ({
      ...attachment,
      uploadedBy: normalizeTaskUser(attachment.uploadedBy),
    })),
    activity: (nextTask.activity || []).map((entry) => ({
      ...entry,
      userId: normalizeTaskUser(entry.userId),
    })),
    labels: normalizeStringList(nextTask.labels),
    components: normalizeStringList(nextTask.components),
    fixVersions: normalizeStringList(nextTask.fixVersions),
    affectsVersions: normalizeStringList(nextTask.affectsVersions),
    environment: nextTask.environment || "",
    originalEstimateHours: Number(nextTask.originalEstimateHours || 0),
    timeSpentHours: Number(nextTask.timeSpentHours || 0),
    remainingEstimateHours: Number(nextTask.remainingEstimateHours || 0),
    statusLabel: getStatusLabel(nextTask.status),
    priorityLabel: getPriorityLabel(nextTask.priority),
    typeLabel: getTypeLabel(nextTask.type),
  };
};

const ensureValidUser = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    return null;
  }

  return User.findById(userId).select("_id");
};

const resolveValidUserIds = async (userIds = []) => {
  const ids = [
    ...new Set((Array.isArray(userIds) ? userIds : [])
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => String(id))),
  ];

  if (!ids.length) {
    return [];
  }

  const users = await User.find({
    _id: { $in: ids },
  })
    .select("_id")
    .lean();

  return users.map((user) => user._id);
};

const resolveTaskLinks = async (links = [], currentTaskId = null) => {
  const sanitizedLinks = (Array.isArray(links) ? links : [])
    .filter((entry) => mongoose.isValidObjectId(entry?.taskId))
    .map((entry) => ({
      taskId: String(entry.taskId),
      relationType: normalizeRelationType(entry.relationType),
    }))
    .filter((entry) => !currentTaskId || String(entry.taskId) !== String(currentTaskId));

  const uniqueLinks = sanitizedLinks.filter(
    (entry, index, allEntries) =>
      allEntries.findIndex(
        (candidate) =>
          candidate.taskId === entry.taskId && candidate.relationType === entry.relationType
      ) === index
  );

  if (!uniqueLinks.length) {
    return [];
  }

  const validTasks = await Task.find({
    _id: { $in: uniqueLinks.map((entry) => entry.taskId) },
  })
    .select("_id")
    .lean();

  const validTaskIds = new Set(validTasks.map((task) => String(task._id)));

  return uniqueLinks
    .filter((entry) => validTaskIds.has(entry.taskId))
    .map((entry) => ({
      taskId: entry.taskId,
      relationType: entry.relationType,
    }));
};

const sanitizeAttachments = (attachments = []) =>
  (Array.isArray(attachments) ? attachments : []).map((attachment) => {
    const originalName = String(attachment?.originalName || "").trim();
    const dataUrl = String(attachment?.dataUrl || "");
    const mimeType = String(attachment?.mimeType || "application/octet-stream").trim();
    const size = Number(attachment?.size || 0);

    if (!originalName || !dataUrl.startsWith("data:")) {
      throw badRequestError("Each attachment must include a file name and data");
    }

    if (Number.isNaN(size) || size < 0 || size > 5 * 1024 * 1024) {
      throw badRequestError("Attachments must be smaller than 5 MB");
    }

    return {
      originalName,
      mimeType,
      size,
      dataUrl,
    };
  });

const canAccessTask = (task, user) => {
  if (isAdminRole(user.role)) {
    return true;
  }

  const assignedId = task.assignedTo?._id || task.assignedTo;
  const reporterId = task.createdBy?._id || task.createdBy;
  const watcherIds = (task.watchers || []).map((watcher) => String(watcher._id || watcher));

  return (
    String(assignedId || "") === String(user._id) ||
    String(reporterId || "") === String(user._id) ||
    watcherIds.includes(String(user._id))
  );
};

const canCollaborateOnTask = (task, user) => {
  if (isAdminRole(user.role)) {
    return true;
  }

  const assignedId = task.assignedTo?._id || task.assignedTo;
  const reporterId = task.createdBy?._id || task.createdBy;

  return (
    String(assignedId || "") === String(user._id) || String(reporterId || "") === String(user._id)
  );
};

const getAccessibleTask = async (taskId, user, { detail = false } = {}) => {
  if (!mongoose.isValidObjectId(taskId)) {
    throw badRequestError("Invalid task id");
  }

  const query = detail
    ? Task.findById(taskId).populate(taskDetailPopulate)
    : Task.findById(taskId).populate(taskListPopulate);
  const task = await query;

  if (!task || !canAccessTask(task, user)) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  return task;
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
    query.status = normalizeTaskStatus(req.query.status);
  }

  if (req.query.priority && req.query.priority !== "all") {
    query.priority = normalizeTaskPriority(req.query.priority);
  }

  if (req.query.type && req.query.type !== "all") {
    query.type = normalizeTaskType(req.query.type);
  }

  if (req.query.search) {
    const pattern = buildSearchRegex(req.query.search.trim());
    query.$or = [
      { title: pattern },
      { description: pattern },
      { environment: pattern },
      { labels: pattern },
      { components: pattern },
      { fixVersions: pattern },
      { affectsVersions: pattern },
    ];
  }

  return query;
};

const createActivityEntry = (userId, type, message) => ({
  userId,
  type,
  message,
  createdAt: new Date(),
});

const buildTaskPayload = async (payload = {}, { currentTaskId = null } = {}) => {
  const title = String(payload.title || payload.summary || "").trim();

  if (!title) {
    throw badRequestError("Task summary is required");
  }

  const startDate = normalizeDateValue(payload.startDate, "Start date");
  const dueDate = normalizeDateValue(payload.dueDate, "Due date");

  if (startDate && dueDate && dueDate < startDate) {
    throw badRequestError("Due date cannot be before the start date");
  }

  const [assignee, watcherIds, links] = await Promise.all([
    payload.assignedTo ? ensureValidUser(payload.assignedTo) : null,
    resolveValidUserIds(payload.watchers),
    resolveTaskLinks(payload.links, currentTaskId),
  ]);

  if (payload.assignedTo && !assignee) {
    throw badRequestError("Assigned user is invalid");
  }

  return {
    title,
    description: String(payload.description || "").trim(),
    type: normalizeTaskType(payload.type),
    status: normalizeTaskStatus(payload.status),
    priority: normalizeTaskPriority(payload.priority),
    assignedTo: assignee?._id || null,
    watchers: watcherIds,
    startDate,
    dueDate,
    originalEstimateHours: normalizeHoursValue(payload.originalEstimateHours, "Original estimate"),
    timeSpentHours: normalizeHoursValue(payload.timeSpentHours, "Time spent"),
    remainingEstimateHours: normalizeHoursValue(
      payload.remainingEstimateHours,
      "Remaining estimate"
    ),
    links,
    labels: normalizeStringList(payload.labels),
    components: normalizeStringList(payload.components),
    fixVersions: normalizeStringList(payload.fixVersions),
    affectsVersions: normalizeStringList(payload.affectsVersions),
    environment: String(payload.environment || "").trim(),
  };
};

const getEntityId = (value) => {
  const nextValue = value?._id || value;
  return nextValue ? String(nextValue) : null;
};

const buildAdminUpdateInput = (task, payload = {}) => ({
  title: hasOwn(payload, "title") ? payload.title : task.title,
  description: hasOwn(payload, "description") ? payload.description : task.description,
  type: hasOwn(payload, "type") ? payload.type : task.type,
  status: hasOwn(payload, "status") ? payload.status : task.status,
  priority: hasOwn(payload, "priority") ? payload.priority : task.priority,
  assignedTo: hasOwn(payload, "assignedTo") ? payload.assignedTo : getEntityId(task.assignedTo),
  watchers: hasOwn(payload, "watchers")
    ? payload.watchers
    : (task.watchers || []).map((watcher) => getEntityId(watcher)).filter(Boolean),
  startDate: hasOwn(payload, "startDate") ? payload.startDate : task.startDate,
  dueDate: hasOwn(payload, "dueDate") ? payload.dueDate : task.dueDate,
  originalEstimateHours: hasOwn(payload, "originalEstimateHours")
    ? payload.originalEstimateHours
    : task.originalEstimateHours,
  timeSpentHours: hasOwn(payload, "timeSpentHours") ? payload.timeSpentHours : task.timeSpentHours,
  remainingEstimateHours: hasOwn(payload, "remainingEstimateHours")
    ? payload.remainingEstimateHours
    : task.remainingEstimateHours,
  links: hasOwn(payload, "links")
    ? payload.links
    : (task.links || []).map((link) => ({
        taskId: getEntityId(link.taskId),
        relationType: link.relationType,
      })),
  labels: hasOwn(payload, "labels") ? payload.labels : task.labels,
  components: hasOwn(payload, "components") ? payload.components : task.components,
  fixVersions: hasOwn(payload, "fixVersions") ? payload.fixVersions : task.fixVersions,
  affectsVersions: hasOwn(payload, "affectsVersions")
    ? payload.affectsVersions
    : task.affectsVersions,
  environment: hasOwn(payload, "environment") ? payload.environment : task.environment,
});

const applyTaskUpdates = async (task, payload, userId) => {
  const nextValues = await buildTaskPayload(payload, {
    currentTaskId: task._id,
  });
  const messages = [];

  if (task.title !== nextValues.title) {
    task.title = nextValues.title;
    messages.push(`Summary updated to "${nextValues.title}"`);
  }

  if ((task.description || "") !== nextValues.description) {
    task.description = nextValues.description;
    messages.push("Description updated");
  }

  if (normalizeTaskType(task.type) !== nextValues.type) {
    task.type = nextValues.type;
    messages.push(`Issue type changed to ${getTypeLabel(nextValues.type)}`);
  }

  if (normalizeTaskStatus(task.status) !== nextValues.status) {
    task.status = nextValues.status;
    messages.push(`Status changed to ${getStatusLabel(nextValues.status)}`);
  }

  if (normalizeTaskPriority(task.priority) !== nextValues.priority) {
    task.priority = nextValues.priority;
    messages.push(`Priority changed to ${getPriorityLabel(nextValues.priority)}`);
  }

  if (String(task.assignedTo || "") !== String(nextValues.assignedTo || "")) {
    task.assignedTo = nextValues.assignedTo;
    messages.push(nextValues.assignedTo ? "Assignee updated" : "Assignee cleared");
  }

  if (idsChanged(task.watchers || [], nextValues.watchers)) {
    task.watchers = nextValues.watchers;
    messages.push("Watchers updated");
  }

  if (String(task.startDate || "") !== String(nextValues.startDate || "")) {
    task.startDate = nextValues.startDate;
    messages.push("Start date updated");
  }

  if (String(task.dueDate || "") !== String(nextValues.dueDate || "")) {
    task.dueDate = nextValues.dueDate;
    messages.push("Due date updated");
  }

  if (Number(task.originalEstimateHours || 0) !== nextValues.originalEstimateHours) {
    task.originalEstimateHours = nextValues.originalEstimateHours;
    messages.push("Original estimate updated");
  }

  if (Number(task.timeSpentHours || 0) !== nextValues.timeSpentHours) {
    task.timeSpentHours = nextValues.timeSpentHours;
    messages.push("Time spent updated");
  }

  if (Number(task.remainingEstimateHours || 0) !== nextValues.remainingEstimateHours) {
    task.remainingEstimateHours = nextValues.remainingEstimateHours;
    messages.push("Remaining estimate updated");
  }

  if (
    arraysOfObjectsChanged(
      (task.links || []).map((entry) => ({
        taskId: String(entry.taskId),
        relationType: normalizeRelationType(entry.relationType),
      })),
      nextValues.links
    )
  ) {
    task.links = nextValues.links;
    messages.push("Linked tasks updated");
  }

  if (stringListsChanged(task.labels || [], nextValues.labels)) {
    task.labels = nextValues.labels;
    messages.push("Labels updated");
  }

  if (stringListsChanged(task.components || [], nextValues.components)) {
    task.components = nextValues.components;
    messages.push("Components updated");
  }

  if (stringListsChanged(task.fixVersions || [], nextValues.fixVersions)) {
    task.fixVersions = nextValues.fixVersions;
    messages.push("Fix versions updated");
  }

  if (stringListsChanged(task.affectsVersions || [], nextValues.affectsVersions)) {
    task.affectsVersions = nextValues.affectsVersions;
    messages.push("Affects versions updated");
  }

  if ((task.environment || "") !== nextValues.environment) {
    task.environment = nextValues.environment;
    messages.push("Environment updated");
  }

  if (messages.length) {
    task.activity.push(...messages.map((message) => createActivityEntry(userId, "updated", message)));
  }
};

const populateTaskDetail = async (taskId) => {
  const task = await Task.findById(taskId).populate(taskDetailPopulate);
  return normalizeTask(task.toObject());
};

const getTasks = asyncHandler(async (req, res) => {
  const query = await buildTaskQuery(req);
  const tasks = await Task.find(query)
    .select("-comments -workLogs -activity -attachments")
    .populate(taskListPopulate)
    .sort(taskSort)
    .lean();

  res.status(200).json(tasks.map(normalizeTask));
});

const getMyTasks = asyncHandler(async (req, res) => {
  const query = await buildTaskQuery(req, req.user._id);
  const tasks = await Task.find(query)
    .select("-comments -workLogs -activity -attachments")
    .populate(taskListPopulate)
    .sort(taskSort)
    .lean();

  res.status(200).json(tasks.map(normalizeTask));
});

const getTask = asyncHandler(async (req, res) => {
  const task = await getAccessibleTask(req.params.id, req.user, { detail: true });
  res.status(200).json(normalizeTask(task.toObject()));
});

const createTask = asyncHandler(async (req, res) => {
  const payload = await buildTaskPayload(req.body);
  const task = await Task.create({
    ...payload,
    createdBy: req.user._id,
    activity: [createActivityEntry(req.user._id, "created", "Task created")],
  });

  const responseTask = await populateTaskDetail(task._id);
  res.status(201).json(responseTask);
});

const createIssue = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();

  if (!title) {
    res.status(400);
    throw new Error("Issue title is required");
  }

  const task = await Task.create({
    title,
    description: String(req.body.description || "").trim(),
    priority: normalizeTaskPriority(req.body.priority),
    type: "bug",
    assignedTo: req.user._id,
    createdBy: req.user._id,
    status: "open",
    activity: [createActivityEntry(req.user._id, "created", "Issue created from personal workspace")],
  });

  const responseTask = await populateTaskDetail(task._id);
  res.status(201).json(responseTask);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await getAccessibleTask(req.params.id, req.user, { detail: true });
  const adminRequest = isAdminRole(req.user.role);
  const isAssignedUser = String(task.assignedTo?._id || task.assignedTo || "") === String(req.user._id);

  if (!adminRequest && !isAssignedUser) {
    res.status(403);
    throw new Error("You are not allowed to update this task");
  }

  if (adminRequest) {
    await applyTaskUpdates(task, buildAdminUpdateInput(task, req.body), req.user._id);
  } else {
    if (typeof req.body.status === "undefined") {
      res.status(400);
      throw new Error("Only task status can be updated from this view");
    }

    const nextStatus = normalizeTaskStatus(req.body.status);

    if (task.status !== nextStatus) {
      task.status = nextStatus;
      task.activity.push(
        createActivityEntry(req.user._id, "updated", `Status changed to ${getStatusLabel(nextStatus)}`)
      );
    }
  }

  await task.save();
  const responseTask = await populateTaskDetail(task._id);

  res.status(200).json(responseTask);
});

const addTaskComment = asyncHandler(async (req, res) => {
  const task = await getAccessibleTask(req.params.id, req.user, { detail: true });

  if (!canCollaborateOnTask(task, req.user)) {
    res.status(403);
    throw new Error("You are not allowed to comment on this task");
  }

  const text = String(req.body.text || "").trim();

  if (!text) {
    res.status(400);
    throw new Error("Comment text is required");
  }

  task.comments.push({
    userId: req.user._id,
    text,
    mentions: extractMentions(text),
    createdAt: new Date(),
  });
  task.activity.push(createActivityEntry(req.user._id, "commented", "Added a comment"));

  await task.save();
  const responseTask = await populateTaskDetail(task._id);

  res.status(201).json(responseTask);
});

const addTaskWorkLog = asyncHandler(async (req, res) => {
  const task = await getAccessibleTask(req.params.id, req.user, { detail: true });

  if (!canCollaborateOnTask(task, req.user)) {
    res.status(403);
    throw new Error("You are not allowed to log work on this task");
  }

  const timeSpentHours = normalizeHoursValue(req.body.timeSpentHours, "Time spent");

  if (!timeSpentHours) {
    res.status(400);
    throw new Error("Work log time must be greater than zero");
  }

  const description = String(req.body.description || "").trim();

  task.workLogs.push({
    userId: req.user._id,
    description,
    timeSpentHours,
    createdAt: new Date(),
  });
  task.timeSpentHours = Number(task.timeSpentHours || 0) + timeSpentHours;
  task.remainingEstimateHours = Math.max(Number(task.remainingEstimateHours || 0) - timeSpentHours, 0);
  task.activity.push(
    createActivityEntry(req.user._id, "worklogged", `Logged ${timeSpentHours} hour${timeSpentHours === 1 ? "" : "s"} of work`)
  );

  await task.save();
  const responseTask = await populateTaskDetail(task._id);

  res.status(201).json(responseTask);
});

const addTaskAttachments = asyncHandler(async (req, res) => {
  const task = await getAccessibleTask(req.params.id, req.user, { detail: true });

  if (!canCollaborateOnTask(task, req.user)) {
    res.status(403);
    throw new Error("You are not allowed to attach files to this task");
  }

  const attachments = sanitizeAttachments(req.body.attachments);

  if (!attachments.length) {
    res.status(400);
    throw new Error("At least one attachment is required");
  }

  attachments.forEach((attachment) => {
    task.attachments.push({
      ...attachment,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    });
  });
  task.activity.push(
    createActivityEntry(
      req.user._id,
      "attachment",
      `Uploaded ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`
    )
  );

  await task.save();
  const responseTask = await populateTaskDetail(task._id);

  res.status(201).json(responseTask);
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
  getTask,
  createTask,
  createIssue,
  updateTask,
  addTaskComment,
  addTaskWorkLog,
  addTaskAttachments,
  deleteTask,
};
