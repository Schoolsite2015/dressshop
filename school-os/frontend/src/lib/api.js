import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Multi-tenancy Subdomain Resolution
  let subdomain = window.location.hostname.split('.')[0];
  if (subdomain === 'localhost' || subdomain === '127') {
    subdomain = 'snps'; // Default for local dev
  }
  config.headers['x-tenant-subdomain'] = subdomain;

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);
