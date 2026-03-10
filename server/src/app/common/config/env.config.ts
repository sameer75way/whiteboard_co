import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),

  PORT: z.string(),

  MONGODB_URI: z.string(),

  REDIS_URL: z.string(),

  JWT_ACCESS_SECRET: z.string(),

  JWT_REFRESH_SECRET: z.string(),

  JWT_ACCESS_EXPIRES_IN: z.string(),

  JWT_REFRESH_EXPIRES_IN: z.string(),

  CLIENT_URL: z.string(),

  RATE_LIMIT_WINDOW_MS: z.string(),

  RATE_LIMIT_MAX: z.string(),

  BCRYPT_ROUNDS: z.string(),
  SUPERADMIN_EMAIL: z.string().email(),
  SUPERADMIN_PASSWORD: z.string(),
  SUPERADMIN_NAME: z.string(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_NAME: z.string().optional().default("WhiteBoard Co."),
  FROM_EMAIL: z.string().optional().default("noreply@whiteboard.co")
});

export const env = envSchema.parse(process.env);