import { z } from "zod";

export const createElementSchema = z.object({
  type: z.string(),

  position: z.object({
    x: z.number(),
    y: z.number()
  }),

  dimensions: z.object({
    width: z.number(),
    height: z.number()
  }),

  rotation: z.number(),

  style: z.object({
    fill: z.string(),
    stroke: z.string(),
    strokeWidth: z.number(),
    opacity: z.number()
  }),

  content: z.string().optional(),

  points: z.array(z.number()).optional(),

  imageUrl: z.string().optional()
});

export const updateElementSchema = createElementSchema.partial();