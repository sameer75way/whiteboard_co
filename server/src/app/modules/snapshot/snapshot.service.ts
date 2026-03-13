import { SnapshotModel, type ISnapshot } from "./snapshot.model";
import { ElementModel } from "../element/element.model";
import { BoardModel } from "../board/board.model";
import { CommentModel, type IComment } from "../comment/comment.model";
import { AppError } from "../../common/middlewares/errorHandler";
import type {
  CreateSnapshotInput,
  SnapshotListItem,
  SnapshotDetail,
  RestoreResult,
  PaginatedSnapshots
} from "./snapshot.types";
import type { CanvasElement } from "../../common/types/element.types";
import type { ILayer } from "../layer/layer.model";

const toListItem = (doc: ISnapshot): SnapshotListItem => ({
  id: doc._id.toString(),
  boardId: doc.boardId,
  type: doc.type,
  name: doc.name,
  createdBy: doc.createdBy,
  createdAt: doc.createdAt.toISOString()
});

const toDetail = (doc: ISnapshot): SnapshotDetail => ({
  ...toListItem(doc),
  state: doc.state
});

export const takeSnapshot = async (
  input: CreateSnapshotInput
): Promise<ISnapshot> => {
  const snapshot = new SnapshotModel({
    boardId: input.boardId,
    type: input.type,
    name: input.name,
    state: input.state,
    createdBy: input.createdBy
  });
  return snapshot.save();
};

export const listSnapshots = async (
  boardId: string,
  page: number,
  limit: number
): Promise<PaginatedSnapshots> => {
  const skip = (page - 1) * limit;

  const [snapshots, total] = await Promise.all([
    SnapshotModel.find({ boardId })
      .select("-state")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SnapshotModel.countDocuments({ boardId })
  ]);

  const items: SnapshotListItem[] = snapshots.map((doc) => ({
    id: (doc._id as { toString(): string }).toString(),
    boardId: doc.boardId,
    type: doc.type,
    name: doc.name,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt.toISOString()
  }));

  return {
    snapshots: items,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const getSnapshotById = async (
  snapshotId: string
): Promise<SnapshotDetail> => {
  const doc = await SnapshotModel.findById(snapshotId);
  if (!doc) {
    throw new AppError("Snapshot not found", 404);
  }
  return toDetail(doc);
};

export const restoreSnapshot = async (
  snapshotId: string,
  restoredBy: string
): Promise<RestoreResult> => {
  const snapshot = await getSnapshotById(snapshotId);

  await ElementModel.deleteMany({ boardId: snapshot.boardId });

  if (snapshot.state.elements.length > 0) {
    await ElementModel.insertMany(snapshot.state.elements);
  }

  await BoardModel.findByIdAndUpdate(snapshot.boardId, {
    layers: snapshot.state.layers
  });

  await CommentModel.updateMany(
    { boardId: snapshot.boardId },
    { isDeleted: true }
  );

  const snapshotComments = snapshot.state.comments ?? [];
  if (snapshotComments.length > 0) {
    await CommentModel.insertMany(snapshotComments);
  }

  const restoreSnap = await takeSnapshot({
    boardId: snapshot.boardId,
    type: "restore",
    name: `Restored from: ${snapshot.name}`,
    state: snapshot.state,
    createdBy: restoredBy
  });

  return {
    newSnapshotId: restoreSnap._id.toString(),
    restoredElements: snapshot.state.elements,
    restoredLayers: snapshot.state.layers as ILayer[]
  };
};

export const deleteSnapshot = async (
  snapshotId: string,
  boardId: string
): Promise<void> => {
  const snapshot = await SnapshotModel.findById(snapshotId);
  if (!snapshot) {
    throw new AppError("Snapshot not found", 404);
  }
  if (snapshot.boardId !== boardId) {
    throw new AppError("Snapshot does not belong to this board", 400);
  }
  await SnapshotModel.findByIdAndDelete(snapshotId);
};

export const verifyBoardOwner = async (
  boardId: string,
  userId: string
): Promise<void> => {
  const board = await BoardModel.findById(boardId);
  if (!board) {
    throw new AppError("Board not found", 404);
  }
  const member = board.members.find(
    (m) => m.user.toString() === userId && m.status === "Accepted"
  );
  if (member?.role !== "Owner") {
    throw new AppError("Only the board Owner can perform this action", 403);
  }
};

export const getCurrentBoardState = async (
  boardId: string
): Promise<{ elements: CanvasElement[]; layers: ILayer[]; comments: IComment[] }> => {
  const [elementDocs, board, commentDocs] = await Promise.all([
    ElementModel.find({ boardId }).lean(),
    BoardModel.findById(boardId).lean(),
    CommentModel.find({ boardId, isDeleted: false }).lean()
  ]);

  const elements: CanvasElement[] = elementDocs.map((doc) => ({
    _id: doc._id as string,
    boardId: doc.boardId.toString(),
    type: doc.type,
    position: doc.position,
    dimensions: doc.dimensions,
    rotation: doc.rotation,
    style: doc.style,
    content: doc.content,
    points: doc.points,
    imageUrl: doc.imageUrl,
    version: doc.version,
    lamportTs: doc.lamportTs,
    zIndex: doc.zIndex,
    layerId: doc.layerId,
    data: doc.data
  }));

  const layers: ILayer[] = board?.layers ?? [];

  const comments = commentDocs as IComment[];

  return { elements, layers, comments };
};
