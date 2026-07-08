import axios from "axios";

// Create a reusable Axios instance
const api = axios.create({
  // @ts-ignore
  baseURL: import.meta.env?.VITE_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 45000, // 45 seconds timeout for generative AI processing
});

// Interceptor to automatically add JWT auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("aisd_auth_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
