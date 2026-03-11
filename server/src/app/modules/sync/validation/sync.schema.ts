import { z } from "zod";

export const operationSchema = z.object({
  elementId: z.string(),
  operation: z.enum(["create", "update", "delete"]),
  payload: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null(), z.object({}).passthrough(), z.array(z.union([z.string(), z.number()]))])).optional(),
  clientVersion: z.number()
});

export const syncSchema = z.object({
  operations: z.array(operationSchema)
});