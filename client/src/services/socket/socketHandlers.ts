import { socket } from "./socketClient";

import { store } from "../../store/index";
import { setConflict } from "../../store/sync/syncSlice";
import {
  addElementLocally,
  updateElementLocally,
  deleteElementLocally
} from "../../store/canvas/canvasSlice";

import {
  updateCursor,
  removeCursor
} from "../../store/collaboration/collabSlice";

import { applyLww, advanceLocalClock } from "../../lib/utils/crdt";
import type { CanvasElement } from "../../types/element.types";

interface CursorMovedPayload {
  userId: string;
  name?: string;
  x: number;
  y: number;
}

interface ElementDeletedPayload {
  elementId: string;
}

interface UserLeftPayload {
  userId: string;
}

export const registerSocketHandlers = (): (() => void) => {

  const handleCreated = (incoming: CanvasElement) => {
    const state = store.getState().canvas;
    const local = state.elements[incoming._id];
    if (incoming.lamportTs) advanceLocalClock(incoming.lamportTs.seq);
    const winner = applyLww(local, incoming);
    store.dispatch(addElementLocally(winner));
  };

  const handleConflict = () => store.dispatch(setConflict(true));

  const handleUpdated = (incoming: CanvasElement) => {
    const state = store.getState().canvas;
    const local = state.elements[incoming._id];
    if (incoming.lamportTs) advanceLocalClock(incoming.lamportTs.seq);
    const winner = applyLww(local, incoming);
    store.dispatch(updateElementLocally(winner));
  };

  const handleDeleted = (payload: ElementDeletedPayload) =>
    store.dispatch(deleteElementLocally(payload.elementId));

  const handleCursorMoved = (payload: CursorMovedPayload) =>
    store.dispatch(updateCursor({
      userId: payload.userId,
      name: payload.name,
      x: payload.x,
      y: payload.y
    }));

  const handleUserLeft = (payload: UserLeftPayload) =>
    store.dispatch(removeCursor(payload.userId));

  socket.on("element:created", handleCreated);
  socket.on("sync:conflict", handleConflict);
  socket.on("element:updated", handleUpdated);
  socket.on("element:deleted", handleDeleted);
  socket.on("cursor:moved", handleCursorMoved);
  socket.on("user:left", handleUserLeft);

  return () => {
    socket.off("element:created", handleCreated);
    socket.off("sync:conflict", handleConflict);
    socket.off("element:updated", handleUpdated);
    socket.off("element:deleted", handleDeleted);
    socket.off("cursor:moved", handleCursorMoved);
    socket.off("user:left", handleUserLeft);
  };
};