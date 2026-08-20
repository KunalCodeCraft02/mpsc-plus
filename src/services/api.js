"use client";

import axios from "axios";

export const TOKEN_KEY = "mpscpulse.token";

export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Request failed";
    return Promise.reject(Object.assign(new Error(message), {
      status: error?.response?.status,
      data: error?.response?.data,
    }));
  },
);

export default api;

/* ---------------------------- Auth ---------------------------- */
export const authService = {
  register: (payload) => api.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  acceptPolicy: (payload) =>
    api.post("/auth/accept-policy", payload).then((r) => r.data),
  updateProfile: (payload) => api.patch("/auth/me", payload).then((r) => r.data),
};

/* --------------------------- Catalog -------------------------- */
export const catalogService = {
  courses: (params) => api.get("/courses", { params }).then((r) => r.data),
  course: (id) => api.get(`/courses/${id}`).then((r) => r.data),
  lecture: (id) => api.get(`/lectures/${id}`).then((r) => r.data),
  pdf: (id) => api.get(`/pdfs/${id}`).then((r) => r.data),
  quizzes: (params) => api.get("/quizzes", { params }).then((r) => r.data),
  quiz: (id) => api.get(`/quizzes/${id}`).then((r) => r.data),
  enroll: (courseId) => api.post("/enrollments", { courseId }).then((r) => r.data),
};

/* --------------------------- Learning ------------------------- */
export const learningService = {
  dashboard: () => api.get("/me/dashboard").then((r) => r.data),
  myLearning: () => api.get("/me/learning").then((r) => r.data),
  analytics: () => api.get("/me/analytics").then((r) => r.data),
  saveProgress: (payload) => api.post("/progress", payload).then((r) => r.data),
  submitQuiz: (quizId, payload) =>
    api.post(`/quizzes/${quizId}/attempt`, payload).then((r) => r.data),
  attempt: (id) => api.get(`/attempts/${id}`).then((r) => r.data),
};

/* -------------------------- Discovery ------------------------- */
export const searchService = {
  search: (params) => api.get("/search", { params }).then((r) => r.data),
  suggest: (q) => api.get("/search/suggest", { params: { q } }).then((r) => r.data),
};

export const leaderboardService = {
  list: (params) => api.get("/leaderboard", { params }).then((r) => r.data),
};

export const notificationService = {
  list: () => api.get("/notifications").then((r) => r.data),
};

/* ---------------------------- Admin --------------------------- */
export const adminService = {
  stats: () => api.get("/admin/stats").then((r) => r.data),
  analytics: () => api.get("/admin/analytics").then((r) => r.data),
  audit: (params) => api.get("/admin/audit", { params }).then((r) => r.data),
  list: (entity, params) =>
    api.get(`/admin/${entity}`, { params }).then((r) => r.data),
  get: (entity, id) => api.get(`/admin/${entity}/${id}`).then((r) => r.data),
  create: (entity, payload) =>
    api.post(`/admin/${entity}`, payload).then((r) => r.data),
  update: (entity, id, payload) =>
    api.patch(`/admin/${entity}/${id}`, payload).then((r) => r.data),
  remove: (entity, id) =>
    api.delete(`/admin/${entity}/${id}`).then((r) => r.data),
  bulk: (entity, payload) =>
    api.post(`/admin/${entity}/bulk`, payload).then((r) => r.data),
  notify: (payload) => api.post("/admin/notifications", payload).then((r) => r.data),
};
