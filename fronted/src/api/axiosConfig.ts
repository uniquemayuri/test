import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Track whether we've already handled a 401 redirect to prevent loops
let hasRedirected401 = false;

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：当收到 401 时清理本地 token（但跳过登录/注册端点，因为这些端点的 401 是正常业务逻辑）
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    
    // Skip auth endpoints (login, register) - 401 is expected business logic, not token issue
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");
    
    // Only handle 401 for non-auth endpoints with existing token
    if (status === 401 && !isAuthEndpoint) {
      const token = localStorage.getItem('token');
      if (token && !hasRedirected401) {
        // Token exists but 401 - it's invalid/expired
        try {
          localStorage.removeItem('token');
        } catch (e) {
          // ignore
        }
        // Redirect only once to prevent loops
        hasRedirected401 = true;
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/';
          }, 500);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;