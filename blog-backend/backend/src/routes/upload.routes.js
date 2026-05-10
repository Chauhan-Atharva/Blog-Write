// src/routes/upload.routes.js
import { Router } from "express";
import { uploadImage, deleteImage } from "../controllers/upload.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

// All upload routes require authentication
router.post("/image", (req, res, next) => {
  console.log("ROUTE HIT");
  next();},
  verifyJWT, upload.single("image"), uploadImage);
router.delete("/image", verifyJWT, deleteImage);

export default router;
