import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { store, type RootState } from "../../../store/index";
import {
  createRectangleElement,
  createCircleElement,
  createTextElement,
  createStickyNote,
  createTriangleElement,
  createLineElement
} from "../../../lib/utils/canvas.utils";
import { addElement, deleteElement, undo, redo, selectElement } from "../../../store/canvas/canvasSlice";
import { socket } from "../../../services/socket/socketClient";
import { db } from "../../../services/offline/offlineDB";
import { nextLamport } from "../../../lib/utils/crdt";
import type { CanvasElement } from "../../../types/element.types";

export const useWhiteboardCommands = (boardId: string | undefined) => {
  const dispatch = useDispatch();
  const selectedElementId = useSelector((state: RootState) => state.canvas.selectedElementId);
  const elements = useSelector((state: RootState) => state.canvas.elements);
  const selectedElement = selectedElementId ? elements[selectedElementId] : null;
  const activeLayerId = useSelector((state: RootState) => state.layers.activeLayerId);

  const emitCreateElement = useCallback((element: CanvasElement) => {
    if (!boardId) return;
    
    const allElements = Object.values(store.getState().canvas.elements);
    const maxZ = allElements.length > 0 ? Math.max(...allElements.map(el => el.zIndex || 0)) : 0;
    
    const lamportTs = nextLamport();
    const elementWithTs = { ...element, lamportTs, zIndex: maxZ + 1 };
    
    dispatch(addElement(elementWithTs));
    dispatch(selectElement(elementWithTs._id));
    if (navigator.onLine) {
      socket.emit("element:create", { boardId, element: elementWithTs });
    } else {
      db.operations.add({ 
        boardId, 
        elementId: element._id, 
        operation: "create", 
        payload: elementWithTs, 
        clientVersion: element.version, 
        lamportTs 
      });
    }
  }, [boardId, dispatch]);

  const getViewportCenter = useCallback((): { x: number; y: number } => {
    const container = document.getElementById("whiteboard-container");
    if (!container) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const stage = (window as any).__WBC_STAGE;
    if (stage) {
      const scale = stage.scaleX();
      const position = stage.position();
      return {
        x: (centerX - position.x) / scale,
        y: (centerY - position.y) / scale
      };
    }
    
    return { x: centerX, y: centerY };
  }, []);

  const handleCreateRectangle = useCallback((x?: number, y?: number) => {
    if (!boardId) return;
    const center = getViewportCenter();
    emitCreateElement(createRectangleElement(boardId, x ?? center.x, y ?? center.y, activeLayerId ?? undefined));
  }, [boardId, emitCreateElement, activeLayerId, getViewportCenter]);

  const handleCreateCircle = useCallback((x?: number, y?: number) => {
    if (!boardId) return;
    const center = getViewportCenter();
    emitCreateElement(createCircleElement(boardId, x ?? center.x, y ?? center.y, activeLayerId ?? undefined));
  }, [boardId, emitCreateElement, activeLayerId, getViewportCenter]);

  const handleCreateText = useCallback((x?: number, y?: number) => {
    if (!boardId) return;
    const center = getViewportCenter();
    emitCreateElement(createTextElement(boardId, x ?? center.x, y ?? center.y, activeLayerId ?? undefined));
  }, [boardId, emitCreateElement, activeLayerId, getViewportCenter]);

  const handleCreateSticky = useCallback((x?: number, y?: number) => {
    if (!boardId) return;
    const center = getViewportCenter();
    emitCreateElement(createStickyNote(boardId, x ?? center.x, y ?? center.y, activeLayerId ?? undefined));
  }, [boardId, emitCreateElement, activeLayerId, getViewportCenter]);

  const handleCreateTriangle = useCallback((x?: number, y?: number) => {
    if (!boardId) return;
    const center = getViewportCenter();
    emitCreateElement(createTriangleElement(boardId, x ?? center.x, y ?? center.y, activeLayerId ?? undefined));
  }, [boardId, emitCreateElement, activeLayerId, getViewportCenter]);

  const handleCreateLine = useCallback((x?: number, y?: number) => {
    if (!boardId) return;
    const center = getViewportCenter();
    emitCreateElement(createLineElement(boardId, x ?? center.x, y ?? center.y, activeLayerId ?? undefined));
  }, [boardId, emitCreateElement, activeLayerId, getViewportCenter]);

  const handleDelete = useCallback(() => {
    if (!boardId || !selectedElementId) return;
    dispatch(deleteElement(selectedElementId));
    if (navigator.onLine) {
      socket.emit("element:delete", { boardId, elementId: selectedElementId });
    } else {
      db.operations.add({
        boardId,
        elementId: selectedElementId,
        operation: "delete",
        payload: selectedElement ?? {},
        clientVersion: selectedElement?.version ?? 0
      });
    }
  }, [boardId, selectedElementId, selectedElement, dispatch]);

  const computeStateDiffAndSync = useCallback((actionType: "undo" | "redo") => {
    const state = store.getState().canvas;

    let nextElements: Record<string, CanvasElement>;
    if (actionType === "undo") {
      if (state.historyPast.length === 0) return;
      nextElements = state.historyPast[state.historyPast.length - 1];
      dispatch(undo());
    } else {
      if (state.historyFuture.length === 0) return;
      nextElements = state.historyFuture[state.historyFuture.length - 1];
      dispatch(redo());
    }

    if (!boardId || !navigator.onLine) return;

    const currentElements: Record<string, CanvasElement> = state.elements;

    Object.keys(nextElements).forEach((elementId) => {
      const currentElement = currentElements[elementId];
      const nextElement = nextElements[elementId];

      if (!currentElement) {
        socket.emit("element:create", { boardId, element: nextElement });
      } else if (JSON.stringify(currentElement) !== JSON.stringify(nextElement)) {
        socket.emit("element:update", { boardId, elementId, payload: nextElement });
      }
    });

    Object.keys(currentElements).forEach((elementId) => {
      if (!nextElements[elementId]) {
        socket.emit("element:delete", { boardId, elementId });
      }
    });
  }, [dispatch, boardId]);

  return {
    handleCreateRectangle,
    handleCreateCircle,
    handleCreateText,
    handleCreateSticky,
    handleCreateTriangle,
    handleCreateLine,
    handleDelete,
    computeStateDiffAndSync,
    selectedElementId
  };
};
