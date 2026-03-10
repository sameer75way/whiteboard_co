import { z } from "zod";

export const createBoardSchema = z.object({
  name: z.string().min(2)
});

export const updateBoardSchema = z.object({
  name: z.string().min(2)
});

export const updateRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["Owner", "Collaborator", "Viewer"])
});

export const resolveJoinRequestSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  action: z.enum(["accept", "reject"]),
  role: z.enum(["Collaborator", "Viewer"]).optional()
});