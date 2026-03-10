import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters long")
});