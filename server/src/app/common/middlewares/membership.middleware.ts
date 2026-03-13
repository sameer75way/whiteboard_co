import { Request, Response, NextFunction } from "express";
import { BoardModel } from "../../modules/board/board.model";
import { AppError } from "./errorHandler";
import { catchAsync } from "../utils/catchAsync";

export const isBoardMember = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  const boardId = req.params.id || req.params.boardId || req.body.boardId;

  if (!boardId) {
    throw new AppError("Board ID is required", 400);
  }

  const board = await BoardModel.findById(boardId);

  if (!board) {
    throw new AppError("Board not found", 404);
  }
  if (req.user?.role === "Admin") {
    return next();
  }

  const isMember = board.members.some(
    (member: { user: { toString(): string }; status: string }) => 
      member.user.toString() === userId && 
      member.status === "Accepted"
  );

  if (!isMember) {
    throw new AppError("Forbidden: You are not a member of this board", 403);
  }
  const member = board.members.find((m: { user: { toString(): string } }) => m.user.toString() === userId);
  req.boardMemberRole = member?.role;

  next();
});
