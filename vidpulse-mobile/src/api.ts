import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Change to your backend URL
export const API_URL = "https://yummy-eagles-spend.loca.lt/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "bypass-tunnel-reminder": "true" },
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login:    (d: any) => api.post("/auth/login", d).then(r => r.data),
  register: (d: any) => api.post("/auth/register", d).then(r => r.data),
  me:       ()       => api.get("/auth/me").then(r => r.data),
};

export const videosApi = {
  list:   ()          => api.get("/videos/").then(r => r.data),
  get:    (id: string)=> api.get(`/videos/${id}`).then(r => r.data),
  delete: (id: string)=> api.delete(`/videos/${id}`).then(r => r.data),
  upload: async (uri: string, name: string, title: string, onProgress?: (p: number) => void) => {
    const form = new FormData();
    form.append("file", { uri, name, type: "video/mp4" } as any);
    form.append("title", title);
    return api.post("/videos/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / (e.total || 1))),
    }).then(r => r.data);
  },
  analyzeYoutube: (url: string, title?: string) =>
    api.post("/videos/analyze-youtube", { url, title: title || "" }).then(r => r.data),
};

export const analysisApi = {
  get:       (id: string) => api.get(`/analysis/${id}`).then(r => r.data),
  reanalyze: (id: string) => api.post(`/analysis/${id}/reanalyze`).then(r => r.data),
  clips:     (id: string) => api.get(`/analysis/${id}/clip-suggestions`).then(r => r.data),
};
