import { socket } from "./socketClient";

import { store } from "../../store/index";
import { setConflict } from "../../store/sync/syncSlice";
import {
  addElementLocally,
  updateElementLocally,
  deleteElementLocally,
  deleteElementsFromLayer,
  patchElementPosition
} from "../../store/canvas/canvasSlice";

import {
  updateCursor,
  removeCursor
} from "../../store/collaboration/collabSlice";

import {
  addLayer,
  updateLayer,
  removeLayer,
  reorderLayers
} from "../../store/layers/layersSlice";

import { addNotification } from "../../store/notifications/notificationsSlice";

import { applyLww, advanceLocalClock } from "../../lib/utils/crdt";
import type { CanvasElement } from "../../types/element.types";
import type { Layer } from "../../types/board.types";

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

interface LayerCreatedPayload {
  layer: Layer;
}

interface LayerUpdatedPayload {
  layerId: string;
  changes: Partial<Omit<Layer, "id">>;
}

interface LayerDeletedPayload {
  layerId: string;
  fallbackLayerId: string;
}

interface LayerReorderedPayload {
  orderedLayerIds: string[];
}

interface LayerElementMovedPayload {
  elementId: string;
  newLayerId: string;
}

interface LayerEditRejectedPayload {
  code: string;
  layerName: string;
  rejectedOp: string;
}

interface LayerOfflineRejectedPayload {
  rejectedOps: {
    elementId: string;
    operation: string;
    layerName: string;
    code: string;
  }[];
}

import {
  appendComment,
  appendReply,
  removeComment
} from "../../store/comments/commentsSlice";

import type { CommentPopulated } from "../../types/comment.types";

interface CommentCreatedPayload {
  stickyNoteId: string;
  comment: CommentPopulated;
}

interface CommentReplyCreatedPayload {
  stickyNoteId: string;
  parentCommentId: string;
  reply: CommentPopulated;
}

interface CommentDeletedPayload {
  stickyNoteId: string;
  commentId: string;
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

  const handleElementDragged = (payload: { elementId: string; x: number; y: number }) => {
    const stage = (window as unknown as Record<string, unknown>).__WBC_STAGE as
      | { findOne: (selector: string) => { x: (v: number) => void; y: (v: number) => void; getLayer: () => { batchDraw: () => void } | null } | null }
      | undefined;
    if (stage) {
      const node = stage.findOne(`#${payload.elementId}`);
      if (node) {
        node.x(payload.x);
        node.y(payload.y);
        node.getLayer()?.batchDraw();
        return;
      }
    }
    store.dispatch(patchElementPosition(payload));
  };

  const handleUserLeft = (payload: UserLeftPayload) =>
    store.dispatch(removeCursor(payload.userId));

  const handleLayerCreated = (payload: LayerCreatedPayload) =>
    store.dispatch(addLayer(payload.layer));

  const handleLayerUpdated = (payload: LayerUpdatedPayload) =>
    store.dispatch(updateLayer({ layerId: payload.layerId, changes: payload.changes }));

  const handleLayerDeleted = (payload: LayerDeletedPayload) => {
    store.dispatch(deleteElementsFromLayer(payload.layerId));
    store.dispatch(removeLayer({ layerId: payload.layerId }));
  };

  const handleLayerReordered = (payload: LayerReorderedPayload) =>
    store.dispatch(reorderLayers(payload.orderedLayerIds));

  const handleLayerElementMoved = (payload: LayerElementMovedPayload) => {
    const state = store.getState().canvas;
    const el = state.elements[payload.elementId];
    if (el) {
      store.dispatch(updateElementLocally({ ...el, layerId: payload.newLayerId }));
    }
  };

  const handleLayerEditRejected = (payload: LayerEditRejectedPayload) => {
    store.dispatch(addNotification({
      id: `reject-${Date.now()}`,
      message: `Operation "${payload.rejectedOp}" rejected: Layer "${payload.layerName}" is locked.`
    }));
  };

  const handleLayerOfflineRejected = (payload: LayerOfflineRejectedPayload) => {
    const opList = payload.rejectedOps
      .map((op) => `${op.operation} on "${op.layerName}"`)
      .join(", ");
    store.dispatch(addNotification({
      id: `offline-reject-${Date.now()}`,
      message: `Offline operations rejected (locked layers): ${opList}`
    }));
  };

  const handleCommentCreated = (payload: CommentCreatedPayload) => {
    store.dispatch(appendComment({
      stickyNoteId: payload.stickyNoteId,
      comment: payload.comment
    }));
  };

  const handleCommentReplyCreated = (payload: CommentReplyCreatedPayload) => {
    store.dispatch(appendReply({
      stickyNoteId: payload.stickyNoteId,
      parentCommentId: payload.parentCommentId,
      reply: payload.reply
    }));
  };

  const handleCommentDeleted = (payload: CommentDeletedPayload) => {
    store.dispatch(removeComment({
      stickyNoteId: payload.stickyNoteId,
      commentId: payload.commentId
    }));
  };

  socket.on("element:created", handleCreated);
  socket.on("sync:conflict", handleConflict);
  socket.on("element:updated", handleUpdated);
  socket.on("element:deleted", handleDeleted);
  socket.on("element:dragged", handleElementDragged);
  socket.on("cursor:moved", handleCursorMoved);
  socket.on("user:left", handleUserLeft);
  socket.on("layer:created", handleLayerCreated);
  socket.on("layer:updated", handleLayerUpdated);
  socket.on("layer:deleted", handleLayerDeleted);
  socket.on("layer:reordered", handleLayerReordered);
  socket.on("layer:element:moved", handleLayerElementMoved);
  socket.on("layer:edit:rejected", handleLayerEditRejected);
  socket.on("layer:offline:rejected", handleLayerOfflineRejected);
  socket.on("comment:created", handleCommentCreated);
  socket.on("comment:reply:created", handleCommentReplyCreated);
  socket.on("comment:deleted", handleCommentDeleted);

  return () => {
    socket.off("element:created", handleCreated);
    socket.off("sync:conflict", handleConflict);
    socket.off("element:updated", handleUpdated);
    socket.off("element:deleted", handleDeleted);
    socket.off("element:dragged", handleElementDragged);
    socket.off("cursor:moved", handleCursorMoved);
    socket.off("user:left", handleUserLeft);
    socket.off("layer:created", handleLayerCreated);
    socket.off("layer:updated", handleLayerUpdated);
    socket.off("layer:deleted", handleLayerDeleted);
    socket.off("layer:reordered", handleLayerReordered);
    socket.off("layer:element:moved", handleLayerElementMoved);
    socket.off("layer:edit:rejected", handleLayerEditRejected);
    socket.off("layer:offline:rejected", handleLayerOfflineRejected);
    socket.off("comment:created", handleCommentCreated);
    socket.off("comment:reply:created", handleCommentReplyCreated);
    socket.off("comment:deleted", handleCommentDeleted);
  };
};