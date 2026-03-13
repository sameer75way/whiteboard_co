import { Rect, Circle, Text, RegularPolygon, Line } from "react-konva";
import { StickyNoteElement } from "./StickyNoteElement";
import { type KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { store } from "../../../../store/index";
import { useRef, useCallback, type RefObject } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../../store/index";
import { db } from "../../../../services/offline/offlineDB";
import {
  updateElement,
  selectElement
} from "../../../../store/canvas/canvasSlice";
import type { CanvasElement as Element } from "../../../../types/element.types";
import { socket } from "../../../../services/socket/socketClient";
import { nextLamport } from "../../../../lib/utils/crdt";

interface Props {
  element: Element;
  boardId: string;
  isViewer?: boolean;
  isLayerLocked?: boolean;
  onEditText?: (elementId: string, currentText: string, pos: { x: number; y: number; width: number }) => void;
  onContextMenu?: (elementId: string, mouseX: number, mouseY: number) => void;
}

export const CanvasElement = ({ element, boardId, isViewer, isLayerLocked, onEditText, onContextMenu }: Props) => {
  const dispatch = useDispatch();
  const userName = useSelector((state: RootState) => state.auth.user?.name) || "User";
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Text | Konva.Group | Konva.RegularPolygon | Konva.Line>(null);
  const lastCursorEmitRef = useRef<number>(0);

  const selectedElementId = useSelector((state: RootState) => state.canvas.selectedElementId);
  const isSelected = selectedElementId === element._id;

  const isDisabled = isViewer || isLayerLocked;

  const broadcastUpdate = useCallback(async (updated: Element) => {
    if (isDisabled) return;
    const lamportTs = nextLamport();
    const elementWithTs = { ...updated, lamportTs };
    dispatch(updateElement(elementWithTs));
    if (navigator.onLine) {
      socket.emit("element:update", {
        boardId,
        elementId: element._id,
        payload: elementWithTs
      });
    } else {
      await db.operations.add({
        boardId: element.boardId || "",
        elementId: element._id,
        operation: "update",
        payload: elementWithTs,
        clientVersion: element.version,
        lamportTs
      });
    }
  }, [boardId, element._id, element.boardId, element.version, dispatch, isDisabled]);

  const handlePress = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isDisabled) return;
    Object.assign(e, { cancelBubble: true });
    const allElements = Object.values(store.getState().canvas.elements) as Element[];
    const maxZ = allElements.length > 0 ? Math.max(...allElements.map(el => el.zIndex || 0)) : 0;
    broadcastUpdate({
      ...element,
      zIndex: maxZ + 1,
      version: element.version + 1
    });
    dispatch(selectElement(element._id));
    const layer = e.currentTarget.getLayer();
    if (layer) layer.batchDraw();
  }, [dispatch, element, broadcastUpdate, isDisabled]);

  const handleRightClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    if (!onContextMenu) return;
    onContextMenu(element._id, e.evt.clientX, e.evt.clientY);
  }, [element._id, onContextMenu]);

  const handleDragStart = useCallback((e: KonvaEventObject<DragEvent>) => {
    Object.assign(e, { cancelBubble: true });
    const allElements = Object.values(store.getState().canvas.elements) as Element[];
    const maxZ = allElements.length > 0 ? Math.max(...allElements.map(el => el.zIndex || 0)) : 0;
    broadcastUpdate({
      ...element,
      zIndex: maxZ + 1,
      version: element.version + 1
    });
    dispatch(selectElement(element._id));
    const layer = e.currentTarget.getLayer();
    if (layer) layer.batchDraw();
  }, [dispatch, element, broadcastUpdate]);

  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    broadcastUpdate({
      ...element,
      position: { x: node.x(), y: node.y() },
      version: element.version + 1
    });
  }, [element, broadcastUpdate]);

  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    if (navigator.onLine) {
      const now = Date.now();
      if (now - lastCursorEmitRef.current >= 100) {
        lastCursorEmitRef.current = now;
        socket.volatile.emit("element:update", {
          boardId,
          elementId: element._id,
          payload: {
            ...element,
            position: { x: node.x(), y: node.y() }
          }
        });
        const stage = node.getStage();
        if (stage) {
          const pointer = stage.getPointerPosition();
          if (pointer) {
            const transform = stage.getAbsoluteTransform().copy().invert();
            const worldPos = transform.point(pointer);
            socket.emit("cursor:move", {
              boardId,
              x: worldPos.x,
              y: worldPos.y,
              name: userName
            });
          }
        }
      }
    }
  }, [boardId, element, userName]);

  const handleTransformEnd = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    let newWidth = element.dimensions.width;
    let newHeight = element.dimensions.height;
    if (element.type === "circle") {
      const radius = element.dimensions.width / 2;
      newWidth = Math.max(20, radius * 2 * scaleX);
      newHeight = Math.max(20, radius * 2 * scaleY);
    } else {
      newWidth = Math.max(20, node.width() * scaleX);
      newHeight = Math.max(20, node.height() * scaleY);
    }
    broadcastUpdate({
      ...element,
      position: { x: node.x(), y: node.y() },
      dimensions: { width: newWidth, height: newHeight },
      rotation: node.rotation(),
      version: element.version + 1
    });
  }, [element, broadcastUpdate]);

  const handleTransform = useCallback(() => {
    const node = shapeRef.current;
    if (!node || !navigator.onLine) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    let newWidth = element.dimensions.width;
    let newHeight = element.dimensions.height;
    if (element.type === "circle") {
      const radius = element.dimensions.width / 2;
      newWidth = Math.max(20, radius * 2 * scaleX);
      newHeight = Math.max(20, radius * 2 * scaleY);
    } else {
      newWidth = Math.max(20, node.width() * scaleX);
      newHeight = Math.max(20, node.height() * scaleY);
    }
    const now = Date.now();
    if (now - lastCursorEmitRef.current >= 32) {
      lastCursorEmitRef.current = now;
      socket.emit("element:update", {
        boardId,
        elementId: element._id,
        payload: {
          ...element,
          position: { x: node.x(), y: node.y() },
          dimensions: { width: newWidth, height: newHeight },
          rotation: node.rotation()
        }
      });
      const stage = node.getStage();
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          const transform = stage.getAbsoluteTransform().copy().invert();
          const worldPos = transform.point(pointer);
          socket.emit("cursor:move", {
            boardId,
            x: worldPos.x,
            y: worldPos.y,
            name: userName
          });
        }
      }
    }
  }, [boardId, element, userName]);

  const handleDblClick = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isDisabled || !onEditText) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const textNode = e.target;
    const absPos = textNode.getAbsolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    onEditText(element._id, element.content || "", {
      x: stageBox.left + absPos.x,
      y: stageBox.top + absPos.y,
      width: (element.dimensions?.width || 200) * stage.scaleX()
    });
  }, [onEditText, element._id, element.content, element.dimensions?.width, isDisabled]);

  if (element.type === "rectangle") {
    return (
      <Rect
        ref={shapeRef as RefObject<Konva.Rect>}
        id={element._id}
        x={element.position.x}
        y={element.position.y}
        width={element.dimensions.width}
        height={element.dimensions.height}
        rotation={element.rotation || 0}
        fill={element.style.fill}
        stroke={element.style.stroke}
        strokeWidth={element.style.strokeWidth}
        opacity={element.style.opacity}
        draggable={!isDisabled}
        onMouseDown={handlePress}
        onTouchStart={handlePress}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        onContextMenu={handleRightClick}
      />
    );
  }

  if (element.type === "circle") {
    return (
      <Circle
        ref={shapeRef as RefObject<Konva.Circle>}
        id={element._id}
        x={element.position.x}
        y={element.position.y}
        radius={element.dimensions.width / 2}
        rotation={element.rotation || 0}
        fill={element.style.fill}
        stroke={element.style.stroke}
        strokeWidth={element.style.strokeWidth}
        opacity={element.style.opacity}
        draggable={!isDisabled}
        onMouseDown={handlePress}
        onTouchStart={handlePress}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        onContextMenu={handleRightClick}
      />
    );
  }

  if (element.type === "text") {
    return (
      <Text
        ref={shapeRef as RefObject<Konva.Text>}
        id={element._id}
        x={element.position.x}
        y={element.position.y}
        text={element.content || "Text"}
        fontSize={20}
        fill={element.style.fill}
        width={element.dimensions.width}
        rotation={element.rotation || 0}
        draggable={!isDisabled}
        onMouseDown={handlePress}
        onTouchStart={handlePress}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        onContextMenu={handleRightClick}
      />
    );
  }

  if (element.type === "sticky") {
    return (
      <StickyNoteElement
        element={element}
        isSelected={!!isSelected}
        isDisabled={!!isDisabled}
        shapeRef={shapeRef as React.RefObject<Konva.Group>}
        onMouseDown={handlePress}
        onTouchStart={handlePress}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        onContextMenu={handleRightClick}
      />
    );
  }

  if (element.type === "triangle") {
    return (
      <RegularPolygon
        ref={shapeRef as RefObject<Konva.RegularPolygon>}
        id={element._id}
        x={element.position.x}
        y={element.position.y}
        sides={3}
        radius={element.dimensions.width / 2}
        rotation={element.rotation || 0}
        fill={element.style.fill}
        stroke={element.style.stroke}
        strokeWidth={element.style.strokeWidth}
        opacity={element.style.opacity}
        draggable={!isDisabled}
        onMouseDown={handlePress}
        onTouchStart={handlePress}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        onContextMenu={handleRightClick}
      />
    );
  }

  if (element.type === "line") {
    return (
      <Line
        ref={shapeRef as RefObject<Konva.Line>}
        id={element._id}
        x={element.position.x}
        y={element.position.y}
        points={element.points || [0, 0, element.dimensions.width, 0]}
        rotation={element.rotation || 0}
        stroke={element.style.stroke}
        strokeWidth={element.style.strokeWidth}
        opacity={element.style.opacity}
        draggable={!isDisabled}
        hitStrokeWidth={Math.max(20, element.style.strokeWidth)}
        onMouseDown={handlePress}
        onTouchStart={handlePress}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        onContextMenu={handleRightClick}
      />
    );
  }

  return null;
};