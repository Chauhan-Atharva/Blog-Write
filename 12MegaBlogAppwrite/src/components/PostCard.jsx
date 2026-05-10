// src/components/PostCard.jsx
// Changes: use _id, featuredImage.url (Cloudinary), slug for navigation

import React from "react";
import apiService from "../api/config";         // ← changed
import { Link } from "react-router-dom";

function PostCard({ _id, title, featuredImage, slug }) {
  return (
    <Link to={`/post/${slug}`}>
      <div className="w-full bg-gray-100 rounded-xl p-4">
        <div className="w-full justify-center mb-4">
          <img
            src={apiService.getFilePreview(featuredImage?.url)}  // ← Cloudinary URL
            alt={title}
            className="rounded-xl"
          />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
    </Link>
  );
}

export default PostCard;
