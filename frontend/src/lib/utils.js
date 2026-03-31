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
      task.assignedTo?.name,
      task.assignedTo?.email,
      task.createdBy?.name,
      task.createdBy?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(search);
  });
};
