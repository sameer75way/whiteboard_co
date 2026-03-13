import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware";
import { validateBody, validateQuery } from "../../common/middlewares/validate.middleware";
import {
  createManualSnapshotSchema,
  listSnapshotsSchema
} from "./snapshot.dto";
import {
  listSnapshotsController,
  getSnapshotController,
  createManualSnapshotController,
  restoreSnapshotController,
  deleteSnapshotController
} from "./snapshot.controller";

export const snapshotRoutes = Router({ mergeParams: true });

snapshotRoutes.get(
  "/",
  authMiddleware,
  validateQuery(listSnapshotsSchema),
  listSnapshotsController
);

snapshotRoutes.get(
  "/:snapshotId",
  authMiddleware,
  getSnapshotController
);

snapshotRoutes.post(
  "/",
  authMiddleware,
  validateBody(createManualSnapshotSchema),
  createManualSnapshotController
);

snapshotRoutes.post(
  "/:snapshotId/restore",
  authMiddleware,
  restoreSnapshotController
);

snapshotRoutes.delete(
  "/:snapshotId",
  authMiddleware,
  deleteSnapshotController
);
