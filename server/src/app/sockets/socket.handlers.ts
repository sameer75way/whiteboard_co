import { Server, Socket } from "socket.io";

import {
  createElement,
  updateElement,
  deleteElement
} from "../modules/element/element.service";
import { IElement, LamportTimestamp } from "../modules/element/element.model";


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

export const registerSocketHandlers = (
  io: Server,
  socket: Socket
) => {

  const userId = socket.data.userId as string;

  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`[SOCKET] User connected and joined room: user:${userId}`);
  }

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
    socket.join(boardId);
    activeBoards.add(boardId);
    io.to(boardId).emit("user:joined", { userId });
    await broadcastPresence(boardId);
  });

  socket.on("board:leave", async (data: JoinBoardPayload) => {
    const { boardId } = data;
    socket.leave(boardId);
    activeBoards.delete(boardId);
    io.to(boardId).emit("user:left", { userId });
    await broadcastPresence(boardId);
  });

  socket.on("board:request_presence", async (data: { boardId: string }) => {
    await broadcastPresence(data.boardId);
  });

  socket.on("disconnect", async () => {
    for (const boardId of activeBoards) {
      await broadcastPresence(boardId);
    }
    activeBoards.clear();
  });


  socket.on("element:create", async (data: CreateElementPayload) => {
    try {
      const { boardId, element } = data;
      const newElement = await createElement(
        boardId,
        userId,
        element as Partial<IElement>
      );
      io.to(boardId).emit("element:created", newElement);
    } catch (error) {
      console.error("Socket create element error:", error);
    }
  });


  socket.on("element:update", async (data: UpdateElementPayload) => {
    try {
      const { boardId, elementId, payload, lamportTs } = data;

      const { element, accepted } = await updateElement(
        elementId,
        userId,
        payload as Partial<IElement>,
        lamportTs
      );

      if (accepted) {
        socket.to(boardId).emit("element:updated", element);
      } else {
        socket.emit("element:updated", element);
        console.log(`[CRDT] Stale update for ${elementId} — sent authoritative state to sender`);
      }
    } catch (error) {
      console.error("Socket update element error:", error);
    }
  });


  socket.on("element:delete", async (data: DeleteElementPayload) => {
    try {
      const { boardId, elementId } = data;
      await deleteElement(elementId);
      socket.to(boardId).emit("element:deleted", { elementId });
    } catch (error) {
      console.error("Socket delete element error:", error);
    }
  });

  socket.on("cursor:move", (data: CursorMovePayload) => {
    const { boardId, x, y, name } = data;
    socket.to(boardId).emit("cursor:moved", { userId, name, x, y });
  });


  socket.on("sync:operations", async (operations: OfflineOp[]) => {
    for (const op of operations) {
      try {
        if (op.operation === "create") {
          const el = await createElement(op.boardId, userId, op.payload);
          io.to(op.boardId).emit("element:created", el);
        }

        if (op.operation === "update") {
          const { element, accepted } = await updateElement(
            op.elementId,
            userId,
            op.payload,
            op.lamportTs
          );
          if (accepted) {
            io.to(op.boardId).emit("element:updated", element);
          } else {
            socket.emit("element:updated", element);
          }
        }

        if (op.operation === "delete") {
          await deleteElement(op.elementId);
          io.to(op.boardId).emit("element:deleted", { elementId: op.elementId });
        }
      } catch (err) {
        console.error(`sync:operations error for op ${op.operation}:`, err);
      }
    }
    socket.emit("sync:acknowledged");
  });

};