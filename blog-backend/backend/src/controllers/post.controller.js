// src/controllers/post.controller.js
import Post from "../models/Post.js";
import cloudinary from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import slugify from "slugify";

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "megablog/posts", public_id: filename, resource_type: "image" },
      (error, result) => {
        if (error) return reject(new ApiError(500, "Cloudinary upload failed"));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const normalizeFeaturedImage = (image) => {
  if (!image || typeof image !== "object") {
    return { url: null, publicId: null };
  }

  return {
    url: image.url || image.secure_url || null,
    publicId: image.publicId || image.public_id || null,
  };
};

// Helper: delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    console.warn(`⚠️  Could not delete Cloudinary asset: ${publicId}`);
  }
};

// ─── CREATE POST ───────────────────────────────────────────────────────────
export const createPost = asyncHandler(async (req, res) => {
  console.log( "create post request body: ", req.body);
  
  const { title, content, status, featuredImage: bodyFeaturedImage } = req.body;
  //here bodyFeaturedImage is the new name : bodyFeaturedImage = req.body.featuredImage

  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  // Generate a unique slug
  let slug = slugify(title, { lower: true, strict: true });
  const existing = await Post.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  let featuredImage = bodyFeaturedImage;

  // if (req.file) {
  //   const filename = `post-${Date.now()}`;
  //   const result = await uploadToCloudinary(req.file.buffer, filename);
  //   featuredImage = { url: result.secure_url, publicId: result.public_id };
  // }

  const post = await Post.create({
    title,
    slug,
    content,
    featuredImage,
    status: status || "active",
    author: req.user._id,
  });

  const populated = await post.populate("author", "name email");

  return res
    .status(201)
    .json(new ApiResponse(201, populated, "Post created successfully"));
});

// ─── GET ALL ACTIVE POSTS ──────────────────────────────────────────────────
export const getPosts = asyncHandler(async (req, res) => {
  
  const page = req.page;
  const limit = req.limit;

  const posts = await Post.find({ status: "active" })
    .populate("author", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Post.countDocuments({ status: "active" });

  return res
    .status(200)
    .json(new ApiResponse(200, { posts, total, page: Number(page), limit: Number(limit) }));
});
export const getCurrentUserPosts = asyncHandler(async (req, res) => {
  
  const page = req.page;
  const limit = req.limit;
  console.log(req.user);
  
  const posts = await Post.find({ status: "active",
    author: req.user._id,
   })
    .populate("author", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Post.countDocuments({ status: "active" });

  return res
    .status(200)
    .json(new ApiResponse(200, { posts, total, page: Number(page), limit: Number(limit) }));
});

// ─── GET SINGLE POST ───────────────────────────────────────────────────────
export const getPost = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const post = await Post.findOne({ slug }).populate("author", "name email");
  if (!post) throw new ApiError(404, "Post not found");

  return res.status(200).json(new ApiResponse(200, post));
});

// ─── UPDATE POST ───────────────────────────────────────────────────────────
export const updatePost = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { title, content, status, featuredImage: bodyFeaturedImage } = req.body;

  const post = await Post.findOne({ slug });
  if (!post) throw new ApiError(404, "Post not found");

  // Only author or admin can update
  if (
    post.author.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Forbidden: You are not the author of this post");
  }

  if (title) post.title = title;
  if (content) post.content = content;
  if (status) post.status = status;

  // Handle new featured image upload
  // if (req.file) {
  //   await deleteFromCloudinary(post.featuredImage?.publicId);
  //   const filename = `post-${Date.now()}`;
  //   const result = await uploadToCloudinary(req.file.buffer, filename);
  //   post.featuredImage = { url: result.secure_url, publicId: result.public_id };
  // } else 
  if (bodyFeaturedImage) {
    post.featuredImage = bodyFeaturedImage;
  }

  await post.save();
  const updated = await post.populate("author", "name email");

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Post updated successfully"));
});

// ─── DELETE POST ───────────────────────────────────────────────────────────
export const deletePost = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const post = await Post.findOne({ slug });
  if (!post) throw new ApiError(404, "Post not found");

  if (
    post.author.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Forbidden: You are not the author of this post");
  }

  await deleteFromCloudinary(post.featuredImage?.publicId);
  await post.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post deleted successfully"));
});
