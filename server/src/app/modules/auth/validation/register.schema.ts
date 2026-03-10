import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  email: z.string().trim().email("Please provide a valid email").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters long")
});