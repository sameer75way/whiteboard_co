import crypto from "crypto";
import { BoardModel } from "../board/board.model";
import { ElementModel } from "../element/element.model";
import { AppError } from "../../common/middlewares/errorHandler";
import type { ILayer } from "./layer.model";

const generateLayerId = (): string => crypto.randomUUID();

export const getLayerById = (layers: ILayer[], layerId: string): ILayer | undefined =>
  layers.find((l) => l.id === layerId);

export const createLayer = async (boardId: string, name: string): Promise<ILayer> => {
  const board = await BoardModel.findById(boardId);
  if (!board) throw new AppError("Board not found", 404);

  const maxOrder = board.layers.length > 0
    ? Math.max(...board.layers.map((l) => l.order))
    : -1;

  const newLayer: ILayer = {
    id: generateLayerId(),
    name,
    order: maxOrder + 1,
    isVisible: true,
    isLocked: false
  };

  board.layers.push(newLayer);
  await board.save();

  return newLayer;
};

export const renameLayer = async (
  boardId: string,
  layerId: string,
  name: string
): Promise<ILayer> => {
  const board = await BoardModel.findById(boardId);
  if (!board) throw new AppError("Board not found", 404);

  const layer = getLayerById(board.layers, layerId);
  if (!layer) throw new AppError("Layer not found", 404);

  layer.name = name;
  await board.save();

  return layer;
};

export const setVisibility = async (
  boardId: string,
  layerId: string,
  isVisible: boolean
): Promise<ILayer> => {
  const board = await BoardModel.findById(boardId);
  if (!board) throw new AppError("Board not found", 404);

  const layer = getLayerById(board.layers, layerId);
  if (!layer) throw new AppError("Layer not found", 404);

  layer.isVisible = isVisible;
  await board.save();

  return layer;
};

export const setLocked = async (
  boardId: string,
  layerId: string,
  isLocked: boolean
): Promise<ILayer> => {
  const board = await BoardModel.findById(boardId);
  if (!board) throw new AppError("Board not found", 404);

  const layer = getLayerById(board.layers, layerId);
  if (!layer) throw new AppError("Layer not found", 404);

  layer.isLocked = isLocked;
  await board.save();

  return layer;
};

export const updateLayerFields = async (
  boardId: string,
  layerId: string,
  changes: { name?: string; isVisible?: boolean; isLocked?: boolean },
  userId?: string,
  userRole?: string
): Promise<{ layer: ILayer; changes: typeof changes }> => {
  const board = await BoardModel.findById(boardId);
  if (!board) throw new AppError("Board not found", 404);

  if (changes.isLocked !== undefined && userId) {
    const isOwner = board.owner.toString() === userId;
    const isCollaborator = board.members.some(
      (m) => m.user.toString() === userId && m.role === "Collaborator" && m.status === "Accepted"
    );
    const isAdmin = userRole === "Admin";

    if (!isOwner && !isCollaborator && !isAdmin) {
      throw new AppError("Only editors (Owners and Collaborators) can lock or unlock layers", 403);
    }
  }

  const layer = getLayerById(board.layers, layerId);
  if (!layer) throw new AppError("Layer not found", 404);

  if (changes.name !== undefined) layer.name = changes.name;
  if (changes.isVisible !== undefined) layer.isVisible = changes.isVisible;
  if (changes.isLocked !== undefined) layer.isLocked = changes.isLocked;

  await board.save();

  return { layer, changes };
};

export const deleteLayer = async (
  boardId: string,
  layerId: string
): Promise<{ deletedLayerId: string }> => {
  const board = await BoardModel.findById(boardId);
  if (!board) throw new AppError("Board not found", 404);

  if (board.layers.length <= 1) {
    throw new AppError("Cannot delete the last layer", 400);
  }

  const layerIndex = board.layers.findIndex((l) => l.id === layerId);
  if (layerIndex === -1) throw new AppError("Layer not found", 404);

  board.layers.splice(layerIndex, 1);
  await board.save();

  await ElementModel.deleteMany({ boardId, layerId });

  return { deletedLayerId: layerId };
};

export const reorderLayers = async (
  boardId: string,
  orderedLayerIds: string[]
): Promise<ILayer[]> => {
  const board = await BoardModel.findById(boardId);
  if (!board) throw new AppError("Board not found", 404);

  orderedLayerIds.forEach((id, index) => {
    const layer = getLayerById(board.layers, id);
    if (layer) layer.order = index;
  });

  await board.save();

  return [...board.layers].sort((a, b) => a.order - b.order);
};

export const moveElementToLayer = async (
  boardId: string,
  elementId: string,
  newLayerId: string
): Promise<{ elementId: string; newLayerId: string }> => {
  const board = await BoardModel.findById(boardId);
  if (!board) throw new AppError("Board not found", 404);

  const targetLayer = getLayerById(board.layers, newLayerId);
  if (!targetLayer) throw new AppError("Target layer not found", 404);

  const element = await ElementModel.findById(elementId);
  if (!element) throw new AppError("Element not found", 404);

  element.layerId = newLayerId;
  await element.save();

  return { elementId, newLayerId };
};
