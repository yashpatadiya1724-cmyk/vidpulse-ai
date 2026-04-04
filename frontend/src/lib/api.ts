import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post("/auth/register", data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const videosApi = {
  upload: (file: File, title: string, onProgress?: (p: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    return api.post("/videos/upload", form, {
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / (e.total || 1))),
    }).then((r) => r.data);
  },
  analyzeYoutube: (url: string, title?: string) =>
    api.post("/videos/analyze-youtube", { url, title: title || "" }).then((r) => r.data),
  list: () => api.get("/videos/").then((r) => r.data),
  get: (id: string) => api.get(`/videos/${id}`).then((r) => r.data),
  delete: (id: string) => api.delete(`/videos/${id}`).then((r) => r.data),
  thumbnailUrl: (id: string) => `${API_URL}/videos/${id}/thumbnail`,
};

export const analysisApi = {
  get: (videoId: string) => api.get(`/analysis/${videoId}`).then((r) => r.data),
  reanalyze: (videoId: string) => api.post(`/analysis/${videoId}/reanalyze`).then((r) => r.data),
  clipSuggestions: (videoId: string) => api.get(`/analysis/${videoId}/clip-suggestions`).then((r) => r.data),
};
