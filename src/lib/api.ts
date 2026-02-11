import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  throw new Error("VITE_API_URL is not defined");
}

if (baseURL.includes("onrender.com")) {
  throw new Error("Production build is pointing to Render domain. STOP.");
}

if (import.meta.env.PROD && baseURL.includes("localhost")) {
  throw new Error("Production build is pointing to localhost. STOP.");
}

export const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 15000,
});

export default api;
