import axios from "axios";
import { readStoredSession } from "@/lib/session";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const session = readStoredSession();

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

const buildParams = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "" && value !== "all"
    )
  );

export const loginRequest = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const registerRequest = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const fetchUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const fetchApps = async () => {
  const response = await api.get("/apps");
  return response.data;
};

export const updateAppConnection = async ({ slug, connected }) => {
  const response = await api.put(`/apps/${slug}/connection`, { connected });
  return response.data;
};

export const updateAppInstallation = async ({ slug, installed }) => {
  const response = await api.put(`/apps/${slug}/installation`, { installed });
  return response.data;
};

export const updateAppAccess = async ({ slug, payload }) => {
  const response = await api.put(`/apps/${slug}/access`, payload);
  return response.data;
};

export const createUser = async (payload) => {
  const response = await api.post("/users", payload);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const resetUserPassword = async (id) => {
  const response = await api.put(`/users/${id}/reset-password`);
  return response.data;
};

export const bulkImportUsers = async (users) => {
  const response = await api.post("/users/bulk", { users });
  return response.data;
};

export const fetchProjects = async () => {
  const response = await api.get("/projects");
  return response.data;
};

export const createProject = async (payload) => {
  const response = await api.post("/projects", payload);
  return response.data;
};

export const updateProject = async ({ id, payload }) => {
  const response = await api.put(`/projects/${id}`, payload);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

export const fetchTeams = async () => {
  const response = await api.get("/teams");
  return response.data;
};

export const createTeam = async (payload) => {
  const response = await api.post("/teams", payload);
  return response.data;
};

export const fetchTasks = async (filters = {}) => {
  const response = await api.get("/tasks", {
    params: buildParams(filters),
  });
  return response.data;
};

export const fetchMyTasks = async (filters = {}) => {
  const response = await api.get("/tasks/my", {
    params: buildParams(filters),
  });
  return response.data;
};

export const fetchTask = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (payload) => {
  const response = await api.post("/tasks", payload);
  return response.data;
};

export const createIssueReport = async (payload) => {
  const response = await api.post("/tasks/issues", payload);
  return response.data;
};

export const updateTask = async ({ id, payload }) => {
  const response = await api.put(`/tasks/${id}`, payload);
  return response.data;
};

export const createTaskComment = async ({ taskId, text }) => {
  const response = await api.post(`/tasks/${taskId}/comments`, { text });
  return response.data;
};

export const createTaskWorkLog = async ({ taskId, description, timeSpentHours }) => {
  const response = await api.post(`/tasks/${taskId}/worklogs`, {
    description,
    timeSpentHours,
  });
  return response.data;
};

export const uploadTaskAttachments = async ({ taskId, attachments }) => {
  const response = await api.post(`/tasks/${taskId}/attachments`, { attachments });
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const fetchIssues = async (filters = {}) => {
  const response = await api.get("/issues", {
    params: buildParams(filters),
  });
  return response.data;
};

export const createIssue = async (payload) => {
  const response = await api.post("/issues", payload);
  return response.data;
};

export const updateIssue = async ({ id, payload }) => {
  const response = await api.put(`/issues/${id}`, payload);
  return response.data;
};

export const deleteIssue = async (id) => {
  const response = await api.delete(`/issues/${id}`);
  return response.data;
};

export const importIssues = async (payload) => {
  const response = await api.post("/issues/import", payload);
  return response.data;
};

export const fetchComments = async (issueId) => {
  const response = await api.get(`/comments/${issueId}`);
  return response.data;
};

export const createComment = async (payload) => {
  const response = await api.post("/comments", payload);
  return response.data;
};

export default api;
