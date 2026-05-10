// src/components/Post-form/PostForm.jsx
// Changes from original:
//  - Imports from ../api/config instead of ../appwrite/config
//  - featuredImage is now { $id (publicId), url } from Cloudinary
//  - Uses post._id instead of post.$id
//  - getFilePreview returns a direct URL

import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, Select, RTE } from "../index";
import apiService from "../../api/config";          // ← changed
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function PostForm({ post }) {
  const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      content: post?.content || "",
      status: post?.status || "active",
    },
  });

  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth.userData);

  const submit = async (data) => {
    console.log("Form submitted", data);
    try {
      if (post) {
        // ── UPDATE POST ──────────────────────────────────────────────────
        let featuredImage = post.featuredImage; // keep existing if no new file
        
        const ans = apiService.deleteFile(featuredImage.publicId);
        console.log(ans.ok);
        

        if (data.image[0]) {
          const file = await apiService.uploadFile(data.image[0]);
          featuredImage = {
             url: file.url,
             publicId: file.publicId
          };
        }
        const dbPost = await apiService.updatePost(post.slug, {
          ...data,
          featuredImage,
        });
        if (dbPost) navigate(`/post/${dbPost.slug}`);
      } 
      else 
        {
        // ── CREATE POST ──────────────────────────────────────────────────
        const file = await apiService.uploadFile(data.image[0]);
        //first upload file to Cloudinary
        //file is apiResponse with data: {url:  , publicId: }
        
        if (file) {
          const dbPost = await apiService.createPost({
            ...data,
            featuredImage: {
              url: file.url,
              publicId: file.publicId
            },
            userID: userData._id,   // ← _id instead of $id, _id is the id provided by mongoose
          });
          if (dbPost) navigate(`/post/${dbPost.slug}`);
        }
      }
    } catch (error) {
      console.error("PostForm error:", error.message);
    }
  };

  const slugTransform = useCallback((value) => {
    if (value && typeof value === "string") {
      return value
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z\d\s]+/g, "-")
        .replace(/\s/g, "-");
    }
    return "";
  }, []);

  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "title") {
        setValue("slug", slugTransform(value.title, { shouldValidate: true }));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, slugTransform, setValue]);

  return (
    <form onSubmit={handleSubmit(submit, (err) => console.log(err))} className="flex flex-wrap">
      <div className="w-2/3 px-2">
        <Input label="Title :" placeholder="Title" className="mb-4" {...register("title", { required: true })} />
        <Input
          label="Slug :"
          placeholder="Slug"
          className="mb-4"
          {...register("slug", { required: true })}
          onInput={(e) => setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true })}
        />
        <RTE label="Content :" name="content" control={control} defaultValue={getValues("content")} />
      </div>
      <div className="w-1/3 px-2">
        <Input
          label="Featured Image :"
          type="file"
          className="mb-4"
          accept="image/png, image/jpg, image/jpeg, image/gif"
          {...register("image", { required: !post })}
        />
        {post && post.featuredImage?.url && (
          <div className="w-full mb-4">
            <img
              src={apiService.getFilePreview(post.featuredImage.url)}  // ← direct Cloudinary URL
              alt={post.title}
              className="rounded-lg"
            />
          </div>
        )}
        <Select
          options={["active", "inactive"]}
          label="Status"
          className="mb-4"
          {...register("status", { required: true })}
        />
        <Button type="submit" bgColor={post ? "bg-green-500" : undefined} className="w-full">
          {post ? "Update" : "Submit"}
        </Button>
      </div>
    </form>
  );
}

export default PostForm;
