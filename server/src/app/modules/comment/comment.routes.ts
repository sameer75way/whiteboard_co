import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import { createCommentSchema, createReplySchema } from "./comment.dto";
import {
  listCommentsController,
  createCommentController,
  createReplyController,
  deleteCommentController
} from "./comment.controller";

export const commentRoutes = Router({ mergeParams: true });

commentRoutes.use(authMiddleware);

commentRoutes.get(
  "/:elementId/comments",
  listCommentsController
);

commentRoutes.post(
  "/:elementId/comments",
  validateBody(createCommentSchema),
  createCommentController
);

commentRoutes.post(
  "/:elementId/comments/:commentId/replies",
  validateBody(createReplySchema),
  createReplyController
);

commentRoutes.delete(
  "/:elementId/comments/:commentId",
  deleteCommentController
);
