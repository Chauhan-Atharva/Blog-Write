// src/middleware/error.middleware.js
import ApiError from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  // Normalize to ApiError
  let error = err;

  if (!(error instanceof ApiError)) {
    // Mongoose validation error
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      error = new ApiError(400, messages.join(", "));
    }
    // Mongoose duplicate key
    else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      error = new ApiError(409, `${field} already exists`);
    }
    // Mongoose cast error (invalid ObjectId)
    else if (err.name === "CastError") {
      error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
    }
    // JWT errors (if missed upstream)
    else if (err.name === "JsonWebTokenError") {
      error = new ApiError(401, "Invalid token");
    } else if (err.name === "TokenExpiredError") {
      error = new ApiError(401, "Token expired");
    }
    // Generic fallback
    else {
      error = new ApiError(
        err.statusCode || 500,
        err.message || "Internal Server Error"
      );
    }
  }

  const statusCode = error.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${statusCode} - ${error.message}\n`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
