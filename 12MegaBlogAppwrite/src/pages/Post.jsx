// src/pages/Post.jsx
// Changes: import from api/config, use _id instead of $id, featuredImage.url for Cloudinary

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiService from "../api/config";         // ← changed
import { Button, Container } from "../components";
import parse from "html-react-parser";
import { useSelector } from "react-redux";

export default function Post() {
  const [post, setPost] = useState(null);
  const { slug } = useParams();
  const navigate = useNavigate();

  const userData = useSelector((state) => state.auth.userData);

  // Author check: compare MongoDB _id strings
  const isAuthor = post && userData ? post.author?._id === userData._id : false;

  useEffect(() => {
    if (slug) {
      apiService.getPost(slug).then((post) => {
        if (post) setPost(post);
        else navigate("/");
      });
    } else navigate("/");
  }, [slug, navigate]);

  const deletePost = () => {
    apiService.deletePost(post.slug).then((status) => {
      if (status) {
        // Delete featured image from Cloudinary too
        if (post.featuredImage?.publicId) {
          apiService.deleteFile(post.featuredImage.publicId);
        }
        navigate("/");
      }
    });
  };

  return post ? (
    <div className="py-8">
      <Container>
        <div className="w-full flex justify-center mb-4 relative border rounded-xl p-2">
          {/* ← Use post.featuredImage.url (Cloudinary URL) */}
          <img
            src={apiService.getFilePreview(post.featuredImage?.url)}
            alt={post.title}
            className="rounded-xl"
          />
          {isAuthor && (
            <div className="absolute right-6 top-6">
              <Link to={`/edit-post/${post.slug}`}>
                <Button bgColor="bg-green-500" className="mr-3">Edit</Button>
              </Link>
              <Button bgColor="bg-red-500" onClick={deletePost}>Delete</Button>
            </div>
          )}
        </div>
        <div className="w-full mb-6">
          <h1 className="text-2xl font-bold">{post.title}</h1>
        </div>
        <div className="browser-css">{parse(post.content)}</div>
      </Container>
    </div>
  ) : null;
}
