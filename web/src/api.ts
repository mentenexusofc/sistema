import axios from "axios";

const api = axios.create({
  baseURL: "https://my.mentenexus.tech",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("@solo_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
