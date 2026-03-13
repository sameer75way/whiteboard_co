import { z } from "zod";

export const createManualSnapshotSchema = z.object({
  name: z.string().min(1).max(100)
});

export const restoreSnapshotSchema = z.object({});

export const listSnapshotsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
});

export type CreateManualSnapshotBody = z.infer<typeof createManualSnapshotSchema>;
export type ListSnapshotsQuery = z.infer<typeof listSnapshotsSchema>;
