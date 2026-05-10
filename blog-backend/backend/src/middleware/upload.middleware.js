// src/middleware/upload.middleware.js
import multer from "multer";
import path from "path";
import ApiError from "../utils/ApiError.js";
import { log } from "console";

const storage = multer.memoryStorage(); // store in buffer, upload to Cloudinary directly

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new ApiError(400, "Only image files (jpeg, jpg, png, gif, webp) are allowed"));
};

const upload = multer({
  storage,
  fileFilter:(req,res,cb) =>{
    console.log("File filter triggered", file.originalname);
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter,
});

export default upload;
