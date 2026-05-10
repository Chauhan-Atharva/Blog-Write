// src/conf/conf.js  ← REPLACE your existing conf.js with this
// Add VITE_API_BASE_URL to your frontend .env file

const conf = {
  apiBaseUrl: String(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"),
};

export default conf;
