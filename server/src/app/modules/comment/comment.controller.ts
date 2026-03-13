import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { successResponse } from "../../common/utils/response.utils";
import { getIo } from "../../sockets/socket.server";
import {
  createComment,
  createReply,
  getCommentThread,
  softDeleteComment
} from "./comment.service";

export const listCommentsController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const elementId = req.params.elementId as string;
  const thread = await getCommentThread(elementId);
  return successResponse(res, "Comments fetched", thread);
});

export const createCommentController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const userId = req.user!.id;
  const elementId = req.params.elementId as string;
  const { content } = req.body;

  const comment = await createComment(userId, elementId, content);

  const io = getIo();
  const socketId = req.headers["x-socket-id"] as string | undefined;
  const room = `sticky:${elementId}`;
  if (socketId) {
    io.to(room).except(socketId).emit("comment:created", { stickyNoteId: elementId, comment });
  } else {
    io.to(room).emit("comment:created", { stickyNoteId: elementId, comment });
  }

  return successResponse(res, "Comment created", comment);
});

export const createReplyController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const userId = req.user!.id;
  const elementId = req.params.elementId as string;
  const commentId = req.params.commentId as string;
  const { content } = req.body;

  const reply = await createReply(userId, elementId, commentId, content);

  const io = getIo();
  const socketId = req.headers["x-socket-id"] as string | undefined;
  const room = `sticky:${elementId}`;
  if (socketId) {
    io.to(room).except(socketId).emit("comment:reply:created", { stickyNoteId: elementId, parentCommentId: commentId, reply });
  } else {
    io.to(room).emit("comment:reply:created", { stickyNoteId: elementId, parentCommentId: commentId, reply });
  }

  return successResponse(res, "Reply created", reply);
});

export const deleteCommentController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const userId = req.user!.id;
  const elementId = req.params.elementId as string;
  const commentId = req.params.commentId as string;

  await softDeleteComment(commentId, userId);

  const io = getIo();
  const socketId = req.headers["x-socket-id"] as string | undefined;
  const room = `sticky:${elementId}`;
  if (socketId) {
    io.to(room).except(socketId).emit("comment:deleted", { stickyNoteId: elementId, commentId });
  } else {
    io.to(room).emit("comment:deleted", { stickyNoteId: elementId, commentId });
  }

  return successResponse(res, "Comment deleted");
});
