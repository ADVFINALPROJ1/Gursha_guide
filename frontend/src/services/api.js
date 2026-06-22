import axios from "axios";

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const isLocalBrowser =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  return isLocalBrowser ? "http://localhost:5002/api" : "/api";
}

const API = axios.create({
  baseURL: getApiBaseUrl(),
});

export default API;
