// src/utils/cookieOptions.js

// Secure cookie options for refresh token
export const refreshTokenCookieOptions = {
  httpOnly: true,                           // JS cannot access — XSS protection
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,         // 7 days in ms
  path: "/",
};
