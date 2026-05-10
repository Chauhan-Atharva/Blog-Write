// src/controllers/upload.controller.js
import cloudinary from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Standalone image upload to Cloudinary (returns URL + publicId)
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file provided");
  }
  console.log("REQ FILE:", req.file);
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "megablog/uploads", resource_type: "image" },
      (error, result) => {
        if (error) return reject(new ApiError(500, "Upload failed"));
        resolve(result);
      }
    );
    stream.end(req.file.buffer);
  });
  console.log("Backend upload controller result : ", result);
  

  return res.status(200).json(
    new ApiResponse(200, {
      url: result.secure_url,
      publicId: result.public_id,
    }, "Image uploaded successfully")
  );
});

// Delete image from Cloudinary
export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;

  if (!publicId) throw new ApiError(400, "publicId is required");

  await cloudinary.uploader.destroy(publicId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Image deleted successfully"));
});
