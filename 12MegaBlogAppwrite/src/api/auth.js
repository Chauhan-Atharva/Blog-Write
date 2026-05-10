// src/api/auth.js  (replaces src/appwrite/auth.js)
// Update src/conf/conf.js to point VITE_API_BASE_URL to your Express backend

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// In-memory access token store (never store in localStorage — XSS risk)
let accessToken = null;

const setAccessToken = (token) => { accessToken = token; };
const getAccessToken = () => accessToken;

// ── Core fetch wrapper with auto token refresh ─────────────────────────────
const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // sends httpOnly refresh cookie
  });

  // Auto-refresh on 401
  if (response.status === 401 && endpoint !== "/auth/refresh-token") {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.Authorization = `Bearer ${accessToken}`;
      
      response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }

  return response;
};

// ── Refresh Token ──────────────────────────────────────────────────────────
const refreshAccessToken = async () => {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setAccessToken(data.data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// ── Auth Service (mirrors old appwrite/auth.js interface) ─────────────────
export class AuthService {
  async createAccount({ email, password, name }) {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setAccessToken(data.data.accessToken);
    return data.data.user;
  }

  async login({ email, password }) {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setAccessToken(data.data.accessToken);
    return data.data.user; // Return user (equivalent to Appwrite session)
  }

  async getCurrentUser() {
    try {
      const res = await apiFetch("/auth/me");
      if (!res.ok) return null;
      const data = await res.json();
      return data.data.user;
    } catch {
      return null;
    }
  }

  async logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
    }
  }
}

export { apiFetch, setAccessToken, getAccessToken };

const authService = new AuthService();
export default authService;
