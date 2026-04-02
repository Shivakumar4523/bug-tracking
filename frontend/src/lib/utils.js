import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (value, options = {}) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        ...options,
      }).format(new Date(value))
    : "N/A";

export const formatDateTime = (value, options = {}) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        ...options,
      }).format(new Date(value))
    : "N/A";

export const formatHours = (value = 0) => {
  const hours = Number(value || 0);

  if (!hours) {
    return "0h";
  }

  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
};

export const formatFileSize = (value = 0) => {
  const size = Number(value || 0);

  if (!size) {
    return "0 B";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

export const normalizeRole = (role) => (role === "Admin" ? "Admin" : "User");

export const titleCase = (value = "") =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const filterTasks = (tasks = [], filters = {}) => {
  const search = filters.search?.trim().toLowerCase() || "";

  return tasks.filter((task) => {
    if (filters.status && filters.status !== "all" && task.status !== filters.status) {
      return false;
    }

    if (filters.priority && filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }

    if (filters.type && filters.type !== "all" && task.type !== filters.type) {
      return false;
    }

    if (filters.assignedTo && filters.assignedTo !== "all") {
      if (filters.assignedTo === "unassigned") {
        if (task.assignedTo?._id) {
          return false;
        }
      } else if (task.assignedTo?._id !== filters.assignedTo) {
        return false;
      }
    }

    if (!search) {
      return true;
    }

    const searchableContent = [
      task.title,
      task.description,
      task.typeLabel,
      task.environment,
      task.assignedTo?.name,
      task.assignedTo?.email,
      task.createdBy?.name,
      task.createdBy?.email,
      ...(task.labels || []),
      ...(task.components || []),
      ...(task.fixVersions || []),
      ...(task.affectsVersions || []),
      ...(task.watchers || []).map((watcher) => watcher?.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(search);
  });
};
