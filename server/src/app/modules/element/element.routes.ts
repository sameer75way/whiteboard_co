import { Router } from "express";

import {
  createElementController,
  getElementsController,
  updateElementController,
  deleteElementController
} from "./element.controller";

import { authMiddleware } from "../../common/middlewares/auth.middleware";

import { validateBody } from "../../common/middlewares/validate.middleware";

import {
  createElementSchema,
  updateElementSchema
} from "./validation/element.schema";

export const elementRoutes = Router();

elementRoutes.post(
  "/boards/:id/elements",
  authMiddleware,
  validateBody(createElementSchema),
  createElementController
);

elementRoutes.get(
  "/boards/:id/elements",
  authMiddleware,
  getElementsController
);

elementRoutes.patch(
  "/boards/:id/elements/:elementId",
  authMiddleware,
  validateBody(updateElementSchema),
  updateElementController
);

elementRoutes.delete(
  "/boards/:id/elements/:elementId",
  authMiddleware,
  deleteElementController
);