/**
 * Axios instance for the Dress Shop backend.
 * All requests go through the School OS backend proxy: /api/shop/* → dress shop /api/*
 */
import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

export const shopApi = axios.create({ baseURL: "/api/shop" });

shopApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().shopToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

shopApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().shopLogout();
    }
    return Promise.reject(err);
  }
);

export function formatINR(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export default shopApi;
