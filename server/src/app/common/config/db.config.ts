import mongoose from "mongoose";
import { env } from "./env.config";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);

    console.log("MongoDB connected");

  } catch (error) {
    console.error("MongoDB connection failed");

    process.exit(1);
  }
};