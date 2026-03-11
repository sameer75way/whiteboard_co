import { Stage, Layer, Transformer } from "react-konva";

import { useSelector, useDispatch } from "react-redux";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";

import type { KonvaEventObject } from "konva/lib/Node";

import type Konva from "konva";

import type { RootState } from "../../../../store/index";

import { CanvasElement } from "./CanvasElement";

import { socket } from "../../../../services/socket/socketClient";
import { db } from "../../../../services/offline/offlineDB";

import {
  selectElement,
  updateElement,
  addElement
} from "../../../../store/canvas/canvasSlice";
import {
  createRectangleElement,
  createCircleElement,
  createTextElement,
  createStickyNote
} from "../../../../lib/utils/canvas.utils";

interface Props {
  boardId: string;
}

interface TextEditState {
  elementId: string;
  text: string;
  x: number;
  y: number;
  width: number;
}

export const CanvasBoard = ({ boardId }: Props) => {

  const dispatch = useDispatch();

  const elements = useSelector(
    (state: RootState) => state.canvas.elements
  );

  const selectedElementId = useSelector(
    (state: RootState) => state.canvas.selectedElementId
  );
  
  const userName = useSelector((state: RootState) => state.auth.user?.name);

  const elementList = useMemo(() => Object.values(elements), [elements]);

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const lastCursorEmitRef = useRef<number>(0);

  const [textEdit, setTextEdit] = useState<TextEditState | null>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    const layer = layerRef.current;
    if (!transformer || !layer) return;

    if (!selectedElementId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const selectedNode = layer.findOne(`#${selectedElementId}`);
    if (selectedNode) {
      transformer.nodes([selectedNode]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedElementId, elements]);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const now = Date.now();
    if (now - lastCursorEmitRef.current < 16) return;
    lastCursorEmitRef.current = now;
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    socket.emit("cursor:move", { boardId, x: pointer.x, y: pointer.y, name: userName });
  }, [boardId, userName]);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.08;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    };

    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position(newPos);
    stage.batchDraw();

    const bgContainer = document.getElementById('whiteboard-container');
    if (bgContainer) {
      bgContainer.style.backgroundPosition = `${newPos.x}px ${newPos.y}px`;
      bgContainer.style.backgroundSize = `${40 * clampedScale}px ${40 * clampedScale}px`;
    }
  }, []);

  const handleStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      dispatch(selectElement(null));
    }
  }, [dispatch]);

  const [isPanMode, setIsPanMode] = useState(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsPanMode(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsPanMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const handleEditText = useCallback((elementId: string, currentText: string, pos: { x: number; y: number; width: number }) => {
    setTextEdit({
      elementId,
      text: currentText,
      x: pos.x,
      y: pos.y,
      width: pos.width
    });
  }, []);

  const handleTextEditComplete = useCallback(() => {
    if (!textEdit) return;
    const el = elements[textEdit.elementId];
    if (el) {
      const updated = { ...el, content: textEdit.text, version: el.version + 1 };
      dispatch(updateElement(updated));
      if (navigator.onLine) {
        socket.emit("element:update", {
          boardId,
          elementId: el._id,
          payload: updated
        });
      }
    }
    setTextEdit(null);
  }, [textEdit, elements, dispatch, boardId]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const toolType = e.dataTransfer.getData("application/react-whiteboard-tool");
    if (!toolType || !stageRef.current) return;

    stageRef.current.setPointersPositions(e);
    const pointerPosition = stageRef.current.getPointerPosition();
    if (!pointerPosition) return;

    const stage = stageRef.current;
    const scale = stage.scaleX();
    const position = stage.position();

    const x = (pointerPosition.x - position.x) / scale;
    const y = (pointerPosition.y - position.y) / scale;

    let element: import("../../../../types/element.types").CanvasElement | undefined;
    switch (toolType) {
      case "rectangle":
        element = createRectangleElement(boardId, x, y);
        break;
      case "circle":
        element = createCircleElement(boardId, x, y);
        break;
      case "text":
        element = createTextElement(boardId, x, y);
        break;
      case "sticky":
        element = createStickyNote(boardId, x, y);
        break;
      default:
        return;
    }

    if (!element) return;
    dispatch(addElement(element));
    if (navigator.onLine) {
      socket.emit("element:create", { boardId, element });
    } else {
      db.operations.add({ 
        boardId, 
        elementId: element._id, 
        operation: "create", 
        payload: element, 
        clientVersion: element.version 
      });
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{ width: "100%", height: "100%" }}
    >
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        draggable={!selectedElementId || isPanMode}
        style={{ cursor: isPanMode ? 'grab' : 'default' }}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onDragMove={(e) => {
          if (e.target === e.target.getStage()) {
            const stage = e.target.getStage();
            if (!stage) return;
            const bgContainer = document.getElementById('whiteboard-container');
            if (bgContainer) {
              bgContainer.style.backgroundPosition = `${stage.x()}px ${stage.y()}px`;
            }
          }
        }}
      >
        <Layer ref={layerRef}>
          {elementList.map((el) => (
            <CanvasElement
              key={el._id}
              element={el}
              boardId={boardId}
              onEditText={handleEditText}
            />
          ))}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 20 || newBox.height < 20) return oldBox;
              return newBox;
            }}
            enabledAnchors={[
              "top-left",
              "top-center",
              "top-right",
              "middle-left",
              "middle-right",
              "bottom-left",
              "bottom-center",
              "bottom-right"
            ]}
            anchorSize={8}
            anchorCornerRadius={2}
            borderStroke="#6366f1"
            borderStrokeWidth={1.5}
            anchorFill="#fff"
            anchorStroke="#6366f1"
          />
        </Layer>
      </Stage>

      {textEdit && (
        <textarea
          autoFocus
           value={textEdit.text}
          onChange={(e) => setTextEdit({ ...textEdit, text: e.target.value })}
          onBlur={handleTextEditComplete}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setTextEdit(null);
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTextEditComplete();
            }
          }}
          style={{
            position: "fixed",
            left: textEdit.x,
            top: textEdit.y,
            width: Math.max(120, textEdit.width),
            minHeight: 32,
            padding: "4px 8px",
            fontSize: 16,
            fontFamily: "inherit",
            border: "2px solid #6366f1",
            borderRadius: 6,
            outline: "none",
            background: "rgba(15, 23, 42, 0.95)",
            color: "#e2e8f0",
            resize: "both",
            zIndex: 9999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        />
      )}
    </div>
  );
};