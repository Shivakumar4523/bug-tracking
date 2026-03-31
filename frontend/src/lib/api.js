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

export const createUser = async (payload) => {
  const response = await api.post("/users", payload);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
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

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export default api;
