import { Router } from "express";

import {
  createBoardController,
  getBoardsController,
  getBoardController,
  deleteBoardController,
  joinBoardController,
  updateRoleController,
  resolveJoinRequestController,
  removeMemberController,
  getJoinRequestsController,
  getAllBoardsController
} from "./board.controller";

import { authMiddleware } from "../../common/middlewares/auth.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import { requireRole } from "../../common/middlewares/rbac.middleware";

import { createBoardSchema, updateRoleSchema, resolveJoinRequestSchema } from "./validation/board.schema";

export const boardRoutes = Router();

boardRoutes.post(
  "/",
  authMiddleware,
  validateBody(createBoardSchema),
  createBoardController
);

boardRoutes.get(
  "/",
  authMiddleware,
  getBoardsController
);

boardRoutes.get(
  "/join-requests",
  authMiddleware,
  getJoinRequestsController
);

boardRoutes.get(
  "/:id",
  authMiddleware,
  getBoardController
);

boardRoutes.delete(
  "/:id",
  authMiddleware,
  deleteBoardController
);

boardRoutes.post(
  "/join",
  authMiddleware,
  joinBoardController
);

boardRoutes.put(
  "/:id/role",
  authMiddleware,
  validateBody(updateRoleSchema),
  updateRoleController
);

boardRoutes.put(
  "/:id/join-request",
  authMiddleware,
  validateBody(resolveJoinRequestSchema),
  resolveJoinRequestController
);

boardRoutes.delete(
  "/:id/members/:userId",
  authMiddleware,
  removeMemberController
);


boardRoutes.get(
  "/admin/all",
  authMiddleware,
  requireRole(["Admin"]),
  getAllBoardsController
);