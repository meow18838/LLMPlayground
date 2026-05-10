const rawUrl = import.meta.env.VITE_API_BASE_URL;
if (!rawUrl) throw new Error("VITE_API_BASE_URL is not set. Copy .env.example to .env and configure it.");

export const BASE_URL = rawUrl;

export const DEBUG = import.meta.env.VITE_DEBUG === "true";
