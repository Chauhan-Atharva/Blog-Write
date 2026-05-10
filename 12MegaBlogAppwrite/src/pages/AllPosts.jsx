// src/pages/AllPosts.jsx
// Change: import from api/config instead of appwrite/config

import React, { useState, useEffect } from "react";
import { Container, PostCard } from "../components/index";
import apiService from "../api/config";         // ← changed

function AllPosts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    apiService.getCurrentPosts({ page: 1, limit: 100 }).then((result) => {
      if (result) setPosts(result.documents);
    });
  }, []);

  return (
    <div className="w-full py-8">
      <Container>
        <div className="flex flex-wrap">
          {posts.map((post) => (
            <div key={post._id} className="p-2 w-1/4">
              <PostCard {...post} />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

export default AllPosts;
