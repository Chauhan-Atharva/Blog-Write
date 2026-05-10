// src/routes/post.routes.js
import { Router } from "express";
import {
  createPost,
  getPosts,
  getPost,
  getCurrentUserPosts,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

// Public routes
router.get("/", verifyJWT, getPosts);
router.get("/me",verifyJWT, getCurrentUserPosts);
router.get("/:slug", getPost);


// Protected routes (require login)
router.post("/", verifyJWT, upload.single("image"), createPost);
router.put("/:slug", verifyJWT, upload.single("image"), updatePost);
router.delete("/:slug", verifyJWT, deletePost);

export default router;
