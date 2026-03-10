import { Router } from "express";

import { syncController } from "./sync.controller";

import { authMiddleware } from "../../common/middlewares/auth.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";

import { syncSchema } from "./validation/sync.schema";

export const syncRoutes = Router();

syncRoutes.post(
  "/boards/:id/sync",
  authMiddleware,
  validateBody(syncSchema),
  syncController
);