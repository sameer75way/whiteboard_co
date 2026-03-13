import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { successResponse } from "../../common/utils/response.utils";
import { getIo } from "../../sockets/socket.server";
import {
  listSnapshots,
  getSnapshotById,
  takeSnapshot,
  restoreSnapshot,
  getCurrentBoardState,
  deleteSnapshot,
  verifyBoardOwner
} from "./snapshot.service";

export const listSnapshotsController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const boardId = req.params.boardId as string;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const result = await listSnapshots(boardId, page, limit);

  return successResponse(res, "Snapshots fetched", result);
});

export const getSnapshotController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const snapshotId = req.params.snapshotId as string;

  const snapshot = await getSnapshotById(snapshotId);

  return successResponse(res, "Snapshot fetched", snapshot);
});

export const createManualSnapshotController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const boardId = req.params.boardId as string;
  const userId = req.user?.id;
  const { name } = req.body;

  const state = await getCurrentBoardState(boardId);

  const snap = await takeSnapshot({
    boardId,
    type: "manual",
    name,
    state,
    createdBy: userId!
  });

  const io = getIo();
  io.to(boardId).emit("snapshot:saved", {
    snapshotId: snap._id.toString(),
    name: snap.name,
    type: "manual",
    savedAt: snap.createdAt.toISOString()
  });

  return successResponse(res, "Snapshot created", {
    id: snap._id.toString(),
    boardId: snap.boardId,
    type: snap.type,
    name: snap.name,
    createdBy: snap.createdBy,
    createdAt: snap.createdAt.toISOString()
  });
});

export const restoreSnapshotController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const boardId = req.params.boardId as string;
  const snapshotId = req.params.snapshotId as string;
  const userId = req.user?.id;

  const result = await restoreSnapshot(snapshotId, userId!);

  const io = getIo();
  io.to(boardId).emit("board:restored", {
    boardId,
    snapshotId: result.newSnapshotId,
    snapshotName: `Restored snapshot`,
    restoredBy: userId!,
    elements: result.restoredElements,
    layers: result.restoredLayers
  });

  return successResponse(res, "Board restored successfully", {
    newSnapshotId: result.newSnapshotId
  });
});

export const deleteSnapshotController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const boardId = req.params.boardId as string;
  const snapshotId = req.params.snapshotId as string;
  const userId = req.user?.id;

  const snapshot = await getSnapshotById(snapshotId);
  if (snapshot.boardId !== boardId) {
    return res.status(400).json({ success: false, message: "Snapshot does not belong to this board" });
  }

  await verifyBoardOwner(boardId, userId!);
  await deleteSnapshot(snapshotId);

  const io = getIo();
  io.to(boardId).emit("snapshot:deleted", {
    snapshotId
  });

  return successResponse(res, "Snapshot deleted successfully", null);
});
