import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware";
import { isBoardMember } from "../../common/middlewares/membership.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import {
  createLayerController,
  updateLayerController,
  deleteLayerController,
  reorderLayersController,
  moveElementToLayerController
} from "./layer.controller";
import {
  createLayerSchema,
  updateLayerSchema,
  reorderLayersSchema,
  moveElementToLayerSchema
} from "./layer.dto";

export const layerRoutes = Router({ mergeParams: true });

layerRoutes.post(
  "/",
  authMiddleware,
  isBoardMember,
  validateBody(createLayerSchema),
  createLayerController
);

layerRoutes.patch(
  "/reorder",
  authMiddleware,
  isBoardMember,
  validateBody(reorderLayersSchema),
  reorderLayersController
);

layerRoutes.patch(
  "/:layerId",
  authMiddleware,
  isBoardMember,
  validateBody(updateLayerSchema),
  updateLayerController
);

layerRoutes.delete(
  "/:layerId",
  authMiddleware,
  isBoardMember,
  deleteLayerController
);

layerRoutes.patch(
  "/elements/:elementId/layer",
  authMiddleware,
  isBoardMember,
  validateBody(moveElementToLayerSchema),
  moveElementToLayerController
);
