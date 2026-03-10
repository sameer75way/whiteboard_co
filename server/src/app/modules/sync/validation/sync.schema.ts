import { z } from "zod";

export const operationSchema = z.object({
  elementId: z.string(),
  operation: z.enum(["create", "update", "delete"]),
  payload: z.record(z.string(), z.unknown()).optional(),
  clientVersion: z.number()
});

export const syncSchema = z.object({
  operations: z.array(operationSchema)
});