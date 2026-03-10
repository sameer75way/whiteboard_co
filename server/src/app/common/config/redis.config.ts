import Redis from "ioredis";
import { env } from "./env.config";

export const redisClient = new Redis(env.REDIS_URL);

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});