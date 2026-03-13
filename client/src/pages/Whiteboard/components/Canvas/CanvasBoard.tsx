import { Stage, Layer, Transformer } from "react-konva";
import { useSelector, useDispatch } from "react-redux";
import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import type { RootState } from "../../../../store/index";
import { nextLamport } from "../../../../lib/utils/crdt";
import { CanvasElement } from "./CanvasElement";
import { CollaboratorCursors } from "../Collab/CollaboratorCursors";
import { socket } from "../../../../services/socket/socketClient";
import {
  selectElement,
  updateElement,
} from "../../../../store/canvas/canvasSlice";
import { useWhiteboardCommands } from "../../hooks/useWhiteboardCommands";
import { styled } from '@mui/material/styles';
import type { CanvasElement as CanvasElementType } from "../../../../types/element.types";
import type { Layer as LayerType } from "../../../../types/board.types";
import { Menu, MenuItem, Typography } from "@mui/material";
import { useMoveElementToLayerMutation } from "../../../../services/api/layerApi";

const BoardContainer = styled('div')({
  width: "100%",
  height: "100%"
});

const ContextMenuLabel = styled(Typography)({
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 4,
  paddingBottom: 4,
  color: "text.secondary",
  display: "block"
});

const StyledStage = styled(Stage)<{ ispanmode: number }>(({ ispanmode }) => ({
  cursor: ispanmode ? 'grab' : 'default'
}));

const EditTextArea = styled('textarea')<{
  inputleft: number;
  inputtop: number;
  inputwidth: number;
}>(({ inputleft, inputtop, inputwidth }) => ({
  position: "fixed",
  left: inputleft,
  top: inputtop,
  width: Math.max(120, inputwidth),
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
}));

interface Props {
  boardId: string;
  isViewer?: boolean;
  readOnly?: boolean;
  previewElements?: CanvasElementType[];
  previewLayers?: LayerType[];
}

interface TextEditState {
  elementId: string;
  text: string;
  x: number;
  y: number;
  width: number;
}

interface ContextMenuState {
  elementId: string;
  mouseX: number;
  mouseY: number;
}

const buildLayerMap = (layers: LayerType[]): Record<string, LayerType> => {
  const map: Record<string, LayerType> = {};
  layers.forEach((l) => { map[l.id] = l; });
  return map;
};

const filterAndSortElements = (
  elements: Record<string, CanvasElementType>,
  layers: LayerType[]
): CanvasElementType[] => {
  const layerMap = buildLayerMap(layers);

  return Object.values(elements)
    .filter((el) => {
      if (!el.layerId) return true;
      const layer = layerMap[el.layerId];
      return !layer || layer.isVisible;
    })
    .sort((a, b) => {
      const aLayerOrder = a.layerId ? (layerMap[a.layerId]?.order ?? 0) : 0;
      const bLayerOrder = b.layerId ? (layerMap[b.layerId]?.order ?? 0) : 0;
      if (aLayerOrder !== bLayerOrder) return aLayerOrder - bLayerOrder;
      if ((a.zIndex || 0) !== (b.zIndex || 0)) return (a.zIndex || 0) - (b.zIndex || 0);
      const aSeq = a.lamportTs?.seq || 0;
      const bSeq = b.lamportTs?.seq || 0;
      if (aSeq !== bSeq) return aSeq - bSeq;
      const aClient = a.lamportTs?.clientId || "";
      const bClient = b.lamportTs?.clientId || "";
      if (aClient !== bClient) return aClient.localeCompare(bClient);
      return a._id.localeCompare(b._id);
    });
};

const isElementInteractable = (
  el: CanvasElementType,
  layers: LayerType[]
): boolean => {
  if (!el.layerId) return true;
  const layerMap = buildLayerMap(layers);
  const layer = layerMap[el.layerId];
  if (!layer) return true;
  return layer.isVisible && !layer.isLocked;
};

export const CanvasBoard = ({ boardId, isViewer, readOnly = false, previewElements, previewLayers }: Props) => {
  const dispatch = useDispatch();
  const storeElements = useSelector((state: RootState) => state.canvas.elements);
  const selectedElementId = useSelector((state: RootState) => state.canvas.selectedElementId);
  const userName = useSelector((state: RootState) => state.auth.user?.name);
  const storeLayers = useSelector((state: RootState) => state.layers.layers);

  const elements = previewElements
    ? previewElements.reduce<Record<string, CanvasElementType>>((acc, el) => { acc[el._id] = el; return acc; }, {})
    : storeElements;
  const layers = previewLayers ?? storeLayers;
  const [stageScale, setStageScale] = useState(1);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [moveElementToLayerApi] = useMoveElementToLayerMutation();

  const elementList = useMemo(() => filterAndSortElements(elements, layers), [elements, layers]);

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const lastCursorEmitRef = useRef<number>(0);
  const [textEdit, setTextEdit] = useState<TextEditState | null>(null);

  const updateTransformerNodes = useCallback(() => {
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
  }, [selectedElementId]);

  useEffect(() => {
    updateTransformerNodes();
  }, [updateTransformerNodes]);

  useEffect(() => {
    if (stageRef.current) {
      window.__WBC_STAGE = stageRef.current;
    }
    return () => {
      delete window.__WBC_STAGE;
    };
  }, []);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (readOnly) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const now = Date.now();
    if (now - lastCursorEmitRef.current < 30) return;
    lastCursorEmitRef.current = now;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const worldPos = transform.point(pointer);
    socket.emit("cursor:move", { boardId, x: worldPos.x, y: worldPos.y, name: userName });
  }, [boardId, userName, readOnly]);

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
    setStageScale(clampedScale);
    stage.batchDraw();
    const bgContainer = document.getElementById('whiteboard-container');
    if (bgContainer) {
      bgContainer.style.backgroundPosition = `${newPos.x}px ${newPos.y}px`;
      bgContainer.style.backgroundSize = `${40 * clampedScale}px ${40 * clampedScale}px`;
    }
  }, []);

  const handleStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (isViewer || readOnly) return;
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      dispatch(selectElement(null));
    }
  }, [dispatch, isViewer, readOnly]);

  const [isPanMode, setIsPanMode] = useState(false);
  const setupPanListeners = useCallback(() => {
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

  useEffect(() => {
    const cleanup = setupPanListeners();
    return cleanup;
  }, [setupPanListeners]);

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
      const lamportTs = nextLamport();
      const updated = { 
        ...el, 
        content: textEdit.text, 
        version: el.version + 1,
        lamportTs 
      };
      dispatch(updateElement(updated));
      if (navigator.onLine) {
        socket.emit("element:update", {
          boardId,
          elementId: el._id,
          payload: updated,
          lamportTs
        });
      }
    }
    setTextEdit(null);
  }, [textEdit, elements, dispatch, boardId]);

  const { handleCreateRectangle, handleCreateCircle, handleCreateText, handleCreateSticky, handleCreateTriangle, handleCreateLine } = useWhiteboardCommands(boardId);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isViewer || readOnly) return;
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
    switch (toolType) {
      case "rectangle": handleCreateRectangle(x, y); break;
      case "circle": handleCreateCircle(x, y); break;
      case "text": handleCreateText(x, y); break;
      case "sticky": handleCreateSticky(x, y); break;
      case "triangle": handleCreateTriangle(x, y); break;
      case "line": handleCreateLine(x, y); break;
      default: break;
    }
  };

  const handleContextMenu = useCallback((elementId: string, mouseX: number, mouseY: number) => {
    setContextMenu({ elementId, mouseX, mouseY });
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleMoveToLayer = useCallback((layerId: string) => {
    if (!contextMenu) return;
    moveElementToLayerApi({ boardId, elementId: contextMenu.elementId, newLayerId: layerId });
    setContextMenu(null);
  }, [contextMenu, boardId, moveElementToLayerApi]);

  const contextMenuElement = contextMenu ? elements[contextMenu.elementId] : null;
  const otherLayers = layers.filter((l) => l.id !== contextMenuElement?.layerId);

  return (
    <BoardContainer
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <StyledStage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        draggable={readOnly || (!selectedElementId || isPanMode)}
        ispanmode={isPanMode || readOnly ? 1 : 0}
        onMouseMove={readOnly ? undefined : handleMouseMove}
        onWheel={handleWheel}
        onMouseDown={readOnly ? undefined : handleStageMouseDown}
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
              isViewer={isViewer}
              isLayerLocked={readOnly || !isElementInteractable(el, layers)}
              onEditText={readOnly ? () => {} : handleEditText}
              onContextMenu={readOnly ? () => {} : handleContextMenu}
            />
          ))}
          {!readOnly && <CollaboratorCursors currentScale={stageScale} />}
          {!isViewer && !readOnly && (
            <Transformer
              ref={transformerRef}
              rotateEnabled
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 20 || newBox.height < 20) return oldBox;
                return newBox;
              }}
              enabledAnchors={["top-left", "top-center", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-center", "bottom-right"]}
              anchorSize={8}
              anchorCornerRadius={2}
              borderStroke="#6366f1"
              borderStrokeWidth={1.5}
              anchorFill="#fff"
              anchorStroke="#6366f1"
            />
          )}
        </Layer>
      </StyledStage>
      {textEdit && (
        <EditTextArea
          autoFocus
          value={textEdit.text}
          onChange={(e) => setTextEdit({ ...textEdit, text: e.target.value })}
          onBlur={handleTextEditComplete}
          onKeyDown={(e) => {
            if (e.key === "Escape") setTextEdit(null);
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextEditComplete(); }
          }}
          inputleft={textEdit.x}
          inputtop={textEdit.y}
          inputwidth={textEdit.width}
        />
      )}

      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        <ContextMenuLabel variant="caption">
          Move to layer
        </ContextMenuLabel>
        {otherLayers.map((layer) => (
          <MenuItem
            key={layer.id}
            onClick={() => handleMoveToLayer(layer.id)}
          >
            {layer.name}
          </MenuItem>
        ))}
        {otherLayers.length === 0 && (
          <MenuItem disabled>No other layers</MenuItem>
        )}
      </Menu>
    </BoardContainer>
  );
};