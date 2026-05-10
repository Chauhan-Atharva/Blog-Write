// src/api/config.js  (replaces src/appwrite/config.js)
// Drop-in replacement — same method names, same return shapes your components expect.

import { apiFetch } from "./auth.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export class Service {
  // ── Posts ──────────────────────────────────────────────────────────────

  // createPost() sends post data from frontend to backend API
  async createPost({ title, content, featuredImage, status }) {
    // featuredImage here is already a Cloudinary URL from uploadFile() - but it is an object
    const res = await apiFetch("/posts", {
      method: "POST",
      body: JSON.stringify({ title, content, featuredImage, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data; // { _id, title, slug, content, featuredImage, status, author }
  }

  async updatePost(slug, { title, content, featuredImage, status }) {
    const res = await apiFetch(`/posts/${slug}`, {
      method: "PUT",
      body: JSON.stringify({ title, content, featuredImage, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  }

  async deletePost(slug) {
    const res = await apiFetch(`/posts/${slug}`, { method: "DELETE" });
    return res.ok; // true | false
  }

  async getPost(slug) {
    const res = await apiFetch(`/posts/${slug}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.data;
  }

  async getPosts(obj) {
    const res = await apiFetch("/posts", obj);
    if (!res.ok) return false;
    const data = await res.json();
    // Return in same shape as Appwrite: { documents: [...] }
    return { documents: data.data.posts };
  }
  async getCurrentPosts(obj) {
    const res = await apiFetch("/posts/me", obj);
    if (!res.ok) return false;
    const data = await res.json();
    // Return in same shape as Appwrite: { documents: [...] }
    return { documents: data.data.posts };
  }

  // ── File / Image via Cloudinary ────────────────────────────────────────

  /**
   * Uploads image to Cloudinary via the Express backend.
   * Returns an object with { publicId, url }.
   * publicId = Cloudinary publicId (used for deletion)
   * url = Cloudinary secure URL (used for display)
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append("image", file);// backend receives req.file 
   // FormData is a built-in browser object used to send: files, images, text fields

    const token = (await import("./auth.js")).getAccessToken();

    const res = await fetch(`${BASE_URL}/upload/image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      body: formData, // do NOT set Content-Type — browser sets multipart boundary
    });

    const data1 = await res.json();
    console.log("UPLOAD FULL RESPONSE:", data1);
    if (!res.ok) throw new Error(data1.message || "Upload failed");
    const data = data1.data;

    const url =  data.url;
    const publicId = data.publicId ;

    return { publicId: publicId || "",
       url: url || "" };
  }

  async deleteFile(publicId) {
    if (!publicId) return false;
    const res = await apiFetch("/upload/image", {
      method: "DELETE",
      body: JSON.stringify({ publicId }),
    });
    return res.ok; // whenever you fetch - browser auto adds ok key is res
  }

  /**
   * Returns the image URL directly.
   * In your JSX replace:
   *   src={appwriteService.getFilePreview(post.featuredImage)}
   * with:
   *   src={appwriteService.getFilePreview(post.featuredImage)}   ← no JSX change needed
   * because this method now returns a Cloudinary URL or empty string.
   */
 getFilePreview(fileIdOrUrl) {
  if (!fileIdOrUrl) return "";
  // Object format
  if (typeof fileIdOrUrl === "object") {
    return fileIdOrUrl.url || "";
  }
  // String format
  if (
    typeof fileIdOrUrl === "string" &&
    fileIdOrUrl.startsWith("http")
  ) {
    return fileIdOrUrl;
  }

  return "";
}
}

const service = new Service();
export default service;
