import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { successResponse } from "../../common/utils/response.utils";
import { getIo } from "../../sockets/socket.server";
import { AppError } from "../../common/middlewares/errorHandler";
import {
  createLayer,
  updateLayerFields,
  deleteLayer,
  reorderLayers,
  moveElementToLayer
} from "./layer.service";

export const createLayerController = catchAsync(async (req: Request, res: Response) => {
  const boardId = req.params.boardId as string;
  const { name } = req.body;

  const layer = await createLayer(boardId, name);

  const io = getIo();
  io.to(boardId).emit("layer:created", { layer });

  return successResponse(res, "Layer created", layer);
});

export const updateLayerController = catchAsync(async (req: Request, res: Response) => {
  const boardId = req.params.boardId as string;
  const layerId = req.params.layerId as string;
  const userId = req.user?.id;
  const { name, isVisible, isLocked } = req.body;

  if (isLocked !== undefined) {
    const { BoardModel } = await import("../board/board.model");
    const board = await BoardModel.findById(boardId);
    if (!board) throw new AppError("Board not found", 404);

    const isOwner = board.owner.toString() === userId;
    const isCollaborator = board.members.some(
      (m) => m.user.toString() === userId && m.role === "Collaborator" && m.status === "Accepted"
    );
    const isAdmin = req.user?.role === "Admin";

    if (!isOwner && !isCollaborator && !isAdmin) {
      throw new AppError("Only editors (Owners and Collaborators) can lock or unlock layers", 403);
    }
  }

  const { layer, changes } = await updateLayerFields(boardId, layerId, {
    name,
    isVisible,
    isLocked
  });

  const io = getIo();
  io.to(boardId).emit("layer:updated", { layerId, changes });

  return successResponse(res, "Layer updated", layer);
});

export const deleteLayerController = catchAsync(async (req: Request, res: Response) => {
  const boardId = req.params.boardId as string;
  const layerId = req.params.layerId as string;

  const { deletedLayerId } = await deleteLayer(boardId, layerId);

  const io = getIo();
  io.to(boardId).emit("layer:deleted", { layerId: deletedLayerId });

  return successResponse(res, "Layer deleted", { layerId: deletedLayerId });
});

export const reorderLayersController = catchAsync(async (req: Request, res: Response) => {
  const boardId = req.params.boardId as string;
  const { orderedLayerIds } = req.body;

  const layers = await reorderLayers(boardId, orderedLayerIds);

  const io = getIo();
  io.to(boardId).emit("layer:reordered", { orderedLayerIds });

  return successResponse(res, "Layers reordered", layers);
});

export const moveElementToLayerController = catchAsync(async (req: Request, res: Response) => {
  const boardId = req.params.boardId as string;
  const elementId = req.params.elementId as string;
  const { newLayerId } = req.body;

  const result = await moveElementToLayer(boardId, elementId, newLayerId);

  const io = getIo();
  io.to(boardId).emit("layer:element:moved", result);

  return successResponse(res, "Element moved to layer", result);
});
