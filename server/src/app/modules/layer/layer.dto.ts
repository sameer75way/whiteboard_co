import { z } from "zod";

export const createLayerSchema = z.object({
  name: z.string().min(1, "Layer name is required").max(100)
});

export const updateLayerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isVisible: z.boolean().optional(),
  isLocked: z.boolean().optional()
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: "At least one field must be provided" }
);

export const reorderLayersSchema = z.object({
  orderedLayerIds: z.array(z.string().min(1)).min(1)
});

export const moveElementToLayerSchema = z.object({
  newLayerId: z.string().min(1, "Target layer ID is required")
});
