// src/controllers/auth.controller.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { refreshTokenCookieOptions } from "../utils/cookieOptions.js";

// Helper: generate both tokens and save refresh token to DB
const generateTokens = async (userId) => {
  const user = await User.findById(userId).select("+refreshToken");
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// ─── REGISTER ──────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const user = await User.create({ name, email, password });
  const { accessToken, refreshToken } = await generateTokens(user._id);

  const safeUser = { _id: user._id, name: user.name, email: user.email, role: user.role };

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json(new ApiResponse(201, { user: safeUser, accessToken }, "Account created successfully"));
});

// ─── LOGIN ─────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }
  console.log("LOGIN USER:", user.email);


  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const safeUser = { _id: user._id, name: user.name, email: user.email, role: user.role };
  console.log("Login controller");
  

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json(new ApiResponse(200, { user: safeUser, accessToken }, "Logged in successfully"));
});

// ─── LOGOUT ────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  return res
    .status(200)
    .clearCookie("refreshToken", refreshTokenCookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ─── REFRESH ACCESS TOKEN ──────────────────────────────────────────────────
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token mismatch or already used");
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user._id);

  return res
    .status(200)
    .cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

// ─── GET CURRENT USER ──────────────────────────────────────────────────────
export const getCurrentUser = asyncHandler(async (req, res) => {
  console.log("CURRENT USER:", req.user.email);
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, "User fetched successfully"));
});
