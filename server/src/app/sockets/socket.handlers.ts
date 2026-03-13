import { Server, Socket } from "socket.io";

import { createElement, updateElement, deleteElement } from "../modules/element/element.service";
import { IElement, LamportTimestamp } from "../modules/element/element.model";
import { BoardModel } from "../modules/board/board.model";
import { ElementModel } from "../modules/element/element.model";
import type { ILayer } from "../modules/layer/layer.model";
import { takeSnapshot, getCurrentBoardState } from "../modules/snapshot/snapshot.service";
import { cascadeDeleteByStickyNote } from "../modules/comment/comment.service";


interface JoinBoardPayload {
  boardId: string;
}

interface CreateElementPayload {
  boardId: string;
  element: Partial<IElement>;
}

interface UpdateElementPayload {
  boardId: string;
  elementId: string;
  payload: Partial<IElement>;
  lamportTs?: LamportTimestamp;
}

interface DeleteElementPayload {
  boardId: string;
  elementId: string;
}

interface CursorMovePayload {
  boardId: string;
  x: number;
  y: number;
  name?: string;
}

interface OfflineOp {
  boardId: string;
  elementId: string;
  operation: "create" | "update" | "delete";
  payload: Partial<IElement>;
  lamportTs?: LamportTimestamp;
  clientVersion: number;
}

const findLayer = (layers: ILayer[], layerId: string): ILayer | undefined =>
  layers.find((l) => l.id === layerId);

const isLayerLocked = (layers: ILayer[], layerId: string): { locked: boolean; layerName: string } => {
  const layer = findLayer(layers, layerId);
  if (!layer) return { locked: false, layerName: "" };
  return { locked: layer.isLocked, layerName: layer.name };
};

const boardDirtyMap = new Map<string, boolean>();
const boardIntervalMap = new Map<string, ReturnType<typeof setInterval>>();

const markBoardDirty = (boardId: string): void => {
  boardDirtyMap.set(boardId, true);
};

const startAutoSaveInterval = (io: Server, boardId: string): void => {
  if (boardIntervalMap.has(boardId)) return;

  const interval = setInterval(async () => {
    if (!boardDirtyMap.get(boardId)) return;
    boardDirtyMap.set(boardId, false);

    try {
      const state = await getCurrentBoardState(boardId);
      const snap = await takeSnapshot({
        boardId,
        type: "auto",
        name: `Auto-save ${new Date().toISOString()}`,
        state,
        createdBy: `system:${boardId}`
      });

      io.to(boardId).emit("snapshot:saved", {
        snapshotId: snap._id.toString(),
        name: snap.name,
        type: "auto",
        savedAt: snap.createdAt.toISOString()
      });
    } catch (err) {
      console.error(`Auto-save failed for board ${boardId}:`, err);
    }
  }, 30000);

  boardIntervalMap.set(boardId, interval);
};

const stopAutoSaveInterval = async (io: Server, boardId: string): Promise<void> => {
  const sockets = await io.in(boardId).fetchSockets();
  if (sockets.length === 0) {
    const interval = boardIntervalMap.get(boardId);
    if (interval) {
      clearInterval(interval);
      boardIntervalMap.delete(boardId);
    }
    boardDirtyMap.delete(boardId);
  }
};

export const registerSocketHandlers = (
  io: Server,
  socket: Socket
) => {

  const userId = socket.data.userId as string;

  if (userId) {
    socket.join(`user:${userId}`);
  }

  const boardCache = new Map<string, { board: InstanceType<typeof BoardModel>; cachedAt: number }>();
  const CACHE_TTL_MS = 10000;

  const getCachedBoard = async (boardId: string) => {
    const cached = boardCache.get(boardId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.board;
    }
    const board = await BoardModel.findById(boardId);
    if (board) {
      boardCache.set(boardId, { board, cachedAt: Date.now() });
    }
    return board;
  };

  const refreshBoardCache = async (boardId: string) => {
    const board = await BoardModel.findById(boardId);
    if (board) {
      boardCache.set(boardId, { board, cachedAt: Date.now() });
    }
    return board;
  };

  const getMemberRole = (board: InstanceType<typeof BoardModel>): string | null => {
    const member = board.members.find(m => m.user.toString() === userId && m.status === "Accepted");
    if (!member && socket.data.role !== "Admin") return null;
    return member?.role || (socket.data.role === "Admin" ? "Owner" : null);
  };

  const canUserEdit = (role: string | null): boolean => {
    return role === "Owner" || role === "Collaborator";
  };

  const broadcastPresence = async (boardId: string) => {
    try {
      const sockets = await io.in(boardId).fetchSockets();
      const activeUserIds = [...new Set(sockets.map((s) => s.data.userId).filter(Boolean))];
      io.to(boardId).emit("board:presence", activeUserIds);
    } catch (err) {
      console.error(`Failed to broadcast presence for board ${boardId}`, err);
    }
  };

  const activeBoards = new Set<string>();

  socket.on("board:join", async (data: JoinBoardPayload) => {
    const { boardId } = data;
    
    const board = await BoardModel.findById(boardId);
    if (!board) return;

    const member = board.members.find(m => m.user.toString() === userId && m.status === "Accepted");
    if (!member && socket.data.role !== "Admin") return;

    boardCache.set(boardId, { board, cachedAt: Date.now() });

    socket.join(boardId);
    activeBoards.add(boardId);
    io.to(boardId).emit("user:joined", { userId });
    await broadcastPresence(boardId);

    startAutoSaveInterval(io, boardId);
  });

  socket.on("board:leave", async (data: JoinBoardPayload) => {
    const { boardId } = data;
    socket.leave(boardId);
    activeBoards.delete(boardId);
    boardCache.delete(boardId);
    io.to(boardId).emit("user:left", { userId });
    await broadcastPresence(boardId);
    await stopAutoSaveInterval(io, boardId);
  });

  socket.on("board:request_presence", async (data: { boardId: string }) => {
    await broadcastPresence(data.boardId);
  });

  socket.on("disconnect", async () => {
    for (const boardId of activeBoards) {
      await broadcastPresence(boardId);
      await stopAutoSaveInterval(io, boardId);
    }
    activeBoards.clear();
  });


  socket.on("element:create", async (data: CreateElementPayload) => {
    try {
      const { boardId, element } = data;
      
      const board = await getCachedBoard(boardId);
      if (!board) return;
      const role = getMemberRole(board);
      if (!canUserEdit(role)) return;

      const targetLayerId = (element as { layerId?: string }).layerId;
      if (targetLayerId) {
        const { locked, layerName } = isLayerLocked(board.layers, targetLayerId);
        if (locked) {
          socket.emit("layer:edit:rejected", { code: "LAYER_LOCKED", layerName, rejectedOp: "create" });
          return;
        }
      }

      const newElement = await createElement(boardId, userId, role || "Viewer", element as Partial<IElement>);
      markBoardDirty(boardId);
      io.to(boardId).emit("element:created", newElement);
    } catch (error) {
      console.error("Socket create element error:", error);
    }
  });

  socket.on("element:update", async (data: UpdateElementPayload) => {
    try {
      const { boardId, elementId, payload, lamportTs } = data;

      const board = await getCachedBoard(boardId);
      if (!board) return;
      const role = getMemberRole(board);
      if (!canUserEdit(role)) return;

      const existingElement = await ElementModel.findById(elementId);
      const targetLayerId = (payload as { layerId?: string }).layerId || existingElement?.layerId;
      if (targetLayerId) {
        const { locked, layerName } = isLayerLocked(board.layers, targetLayerId);
        if (locked) {
          socket.emit("layer:edit:rejected", { code: "LAYER_LOCKED", layerName, rejectedOp: "update" });
          return;
        }
      }

      const { element, accepted } = await updateElement(
        elementId, userId, role || "Viewer", payload as Partial<IElement>, lamportTs
      );

      markBoardDirty(boardId);

      if (accepted) {
        socket.to(boardId).emit("element:updated", element);
      } else {
        socket.emit("element:updated", element);
      }
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err?.statusCode === 404) return;
      console.error("Socket update element error:", error);
    }
  });


  socket.on("element:delete", async (data: DeleteElementPayload) => {
    try {
      const { boardId, elementId } = data;
      
      const board = await getCachedBoard(boardId);
      if (!board) return;
      const role = getMemberRole(board);
      if (!canUserEdit(role)) return;

      const existingElement = await ElementModel.findById(elementId);
      if (existingElement?.layerId) {
        const { locked, layerName } = isLayerLocked(board.layers, existingElement.layerId);
        if (locked) {
          socket.emit("layer:edit:rejected", { code: "LAYER_LOCKED", layerName, rejectedOp: "delete" });
          return;
        }
      }

      if (existingElement?.type === "sticky") {
        await cascadeDeleteByStickyNote(elementId);
      }

      await deleteElement(elementId, userId, role || "Viewer");
      markBoardDirty(boardId);
      io.to(boardId).emit("element:deleted", { elementId });
    } catch (error) {
      console.error("Socket delete element error:", error);
    }
  });

  socket.on("sticky:comments:join", (data: { stickyNoteId: string }) => {
    socket.join(`sticky:${data.stickyNoteId}`);
  });

  socket.on("sticky:comments:leave", (data: { stickyNoteId: string }) => {
    socket.leave(`sticky:${data.stickyNoteId}`);
  });

  socket.on("cursor:move", (data: CursorMovePayload) => {
    const { boardId, x, y, name } = data;
    socket.to(boardId).emit("cursor:moved", { userId, name, x, y });
  });


  socket.on("sync:operations", async (operations: OfflineOp[]) => {
    if (!operations.length) {
      socket.emit("sync:acknowledged");
      return;
    }

    const rejectedOps: { elementId: string; operation: string; layerName: string; code: "LAYER_LOCKED" }[] = [];
    const boardId = operations[0].boardId;
    const board = await refreshBoardCache(boardId);

    if (!board) {
      socket.emit("sync:acknowledged");
      return;
    }

    const role = getMemberRole(board);
    if (!canUserEdit(role)) {
      socket.emit("sync:acknowledged");
      return;
    }

    for (const op of operations) {
      try {
        let targetLayerId = "";

        if (op.operation === "create") {
          targetLayerId = (op.payload as { layerId?: string }).layerId || "";
        } else {
          const existingEl = await ElementModel.findById(op.elementId);
          targetLayerId = (op.payload as { layerId?: string }).layerId || existingEl?.layerId || "";
        }

        if (targetLayerId) {
          const { locked, layerName } = isLayerLocked(board.layers, targetLayerId);
          if (locked) {
            rejectedOps.push({ elementId: op.elementId, operation: op.operation, layerName, code: "LAYER_LOCKED" });
            continue;
          }
        }

        if (op.operation === "create") {
          const el = await createElement(op.boardId, userId, role || "Viewer", op.payload);
          markBoardDirty(op.boardId);
          socket.to(op.boardId).emit("element:created", el);
        }

        if (op.operation === "update") {
          const { element, accepted } = await updateElement(
            op.elementId, userId, role || "Viewer", op.payload, op.lamportTs
          );
          markBoardDirty(op.boardId);
          if (accepted) {
            socket.to(op.boardId).emit("element:updated", element);
          }
        }

        if (op.operation === "delete") {
          await deleteElement(op.elementId, userId, role || "Viewer");
          markBoardDirty(op.boardId);
          socket.to(op.boardId).emit("element:deleted", { elementId: op.elementId });
        }
      } catch (err) {
        console.error(`sync:operations error for op ${op.operation}:`, err);
      }
    }

    if (rejectedOps.length > 0) {
      socket.emit("layer:offline:rejected", { rejectedOps });
    }

    socket.emit("sync:acknowledged");
  });

};