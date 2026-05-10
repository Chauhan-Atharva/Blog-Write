// src/config/db.js
import mongoose from "mongoose";
import { DB_NAME } from "../../constant.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

let retryCount = 0;

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    retryCount = 0; // reset on success
    console.log(`✅ MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    retryCount++;
    console.error(
      `❌ MongoDB connection failed (attempt ${retryCount}/${MAX_RETRIES}): ${error.message}`
    );

    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(connectDB, RETRY_DELAY_MS);
    } else {
      console.error("🔴 Max retries reached. Exiting process.");
      process.exit(1);
    }
  }
};

// Mongoose event listeners
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
  connectDB();
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err.message);
});

export default connectDB;
