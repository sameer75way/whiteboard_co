import { Request, Response } from "express";
import "../../common/types/expressTypes";

import {
  getBoardById,
  deleteBoard,
  joinBoardByShareCode,
  updateMemberRole,
  createBoard,
  getUserBoards,
  getAllBoards,
  resolveJoinRequest,
  removeMember,
  getPendingJoinRequests
} from "./board.service";

import { successResponse } from "../../common/utils/response.utils";
import { getIo } from "../../sockets/socket.server";
import { catchAsync } from "../../common/utils/catchAsync";
import { AppError } from "../../common/middlewares/errorHandler";

export const createBoardController = catchAsync(async (
  req: Request,
  res: Response
) => {

  const userId = req.user?.id;

  const { name } = req.body;

  const board = await createBoard(userId!, name);

  return successResponse(res, "Board created", board);
});

export const getBoardsController = catchAsync(async (
  req: Request,
  res: Response
) => {

  const userId = req.user?.id;

  const boards = await getUserBoards(userId!);

  return successResponse(res, "Boards fetched", boards);
});

export const getBoardController = catchAsync(async (
  req: Request,
  res: Response
) => {

  const userId = req.user?.id;
  const userRole = req.user?.role;
  const { id } = req.params;

  const board = await getBoardById(id as string, userId!, userRole);

  return successResponse(res, "Board fetched", board);
});

export const deleteBoardController = catchAsync(async (
  req: Request,
  res: Response
) => {

  const userId = req.user?.id;
  const userRole = req.user?.role;
  const { id } = req.params;

  await deleteBoard(id as string, userId!, userRole);

  const io = getIo();
  io.to(id as string).emit("board:deleted", { boardId: id });

  return successResponse(res, "Board deleted");
});

export const getAllBoardsController = catchAsync(async (
  _req: Request,
  res: Response
) => {
  const boards = await getAllBoards();
  return successResponse(res, "All boards fetched", boards);
});

export const joinBoardController = catchAsync(async (
  req: Request,
  res: Response
) => {

  const userId = req.user?.id;
  const { shareCode } = req.body;

  const board = await joinBoardByShareCode(shareCode?.trim(), userId!);

  return successResponse(res, "Joined board", board);
});

export const updateRoleController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const ownerId = req.user?.id;
  const { id } = req.params;
  const { userId, role } = req.body;

  const board = await updateMemberRole(id as string, ownerId!, userId, role);

  return successResponse(res, "Role updated", board);
});

export const getJoinRequestsController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const requests = await getPendingJoinRequests(userId);

  return successResponse(res, "Retrieved join requests successfully", requests);
});

export const resolveJoinRequestController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const ownerId = req.user?.id;
  const { id } = req.params;
  const { userId, action, role } = req.body;

  const board = await resolveJoinRequest(id as string, ownerId!, userId, action, role);

  return successResponse(res, `Join request ${action}ed`, board);
});

export const removeMemberController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const ownerId = req.user?.id;
  const { id, userId } = req.params;

  const board = await removeMember(id as string, ownerId!, userId as string);

  return successResponse(res, "Member removed successfully", board);
});