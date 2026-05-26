// frontend/app/api.js

import axios from "axios";
import { BACKEND_URL } from "./config";

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// 🔍 Debug (keep for now, remove later)
api.interceptors.request.use(
  (config) => {
    console.log("➡️ API:", config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;