import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import type { RootState } from "../../../../store/index";
import { setActiveLayer } from "../../../../store/layers/layersSlice";
import type { Layer } from "../../../../types/board.types";
import {
  useCreateLayerMutation,
  useUpdateLayerMutation,
  useDeleteLayerMutation,
  useReorderLayersMutation
} from "../../../../services/api/layerApi";

type UserRole = "Owner" | "Collaborator" | "Viewer";

const PanelContainer = styled(Box)({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  left: 80,
  width: 240,
  maxHeight: "80vh",
  overflowY: "auto",
  background: "rgba(15, 23, 42, 0.92)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: "12px 8px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  zIndex: 100,
  display: "flex",
  flexDirection: "column",
  gap: 4
});

const PanelHeader = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 8px 8px"
});

const HeaderActions = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 2
});

const LayerRowContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isActive"
})<{ isActive: boolean }>(({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 8px",
  borderRadius: 10,
  cursor: "pointer",
  background: isActive ? "rgba(99, 102, 241, 0.2)" : "transparent",
  border: isActive ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
  transition: "all 0.15s ease",
  "&:hover": {
    background: isActive ? "rgba(99, 102, 241, 0.25)" : "rgba(255,255,255,0.05)"
  }
}));

const SmallIconButton = styled(IconButton)({
  padding: 4,
  color: "rgba(255,255,255,0.6)",
  "&:hover": {
    color: "rgba(255,255,255,0.9)"
  }
});

const LayerName = styled(Typography)({
  flex: 1,
  fontSize: 13,
  fontWeight: 500,
  color: "rgba(255,255,255,0.85)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  userSelect: "none"
});

const LockIndicator = styled(LockIcon)({
  fontSize: 14,
  color: "#f59e0b",
  marginLeft: 2
});

interface SortableLayerRowProps {
  layer: Layer;
  isActive: boolean;
  userRole: UserRole;
  isLast: boolean;
  boardId: string;
  onSelect: (layerId: string) => void;
}

const SortableLayerRow = ({
  layer,
  isActive,
  userRole,
  isLast,
  boardId,
  onSelect
}: SortableLayerRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: layer.id, disabled: userRole === "Viewer" });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const [updateLayerApi] = useUpdateLayerMutation();
  const [deleteLayerApi] = useDeleteLayerMutation();

  const canEdit = userRole === "Owner" || userRole === "Collaborator";
  const canLock = userRole === "Owner" || userRole === "Collaborator";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined
  };

  const handleDoubleClick = useCallback(() => {
    if (!canEdit) return;
    setEditName(layer.name);
    setIsEditing(true);
  }, [layer.name, canEdit]);

  const handleRenameComplete = useCallback(() => {
    setIsEditing(false);
    const trimmed = editName.trim();
    if (trimmed && trimmed !== layer.name) {
      updateLayerApi({ boardId, layerId: layer.id, name: trimmed });
    }
  }, [editName, layer.name, layer.id, boardId, updateLayerApi]);

  const handleToggleVisibility = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateLayerApi({ boardId, layerId: layer.id, isVisible: !layer.isVisible });
  }, [boardId, layer.id, layer.isVisible, updateLayerApi]);

  const handleToggleLock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateLayerApi({ boardId, layerId: layer.id, isLocked: !layer.isLocked });
  }, [boardId, layer.id, layer.isLocked, updateLayerApi]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLayerApi({ boardId, layerId: layer.id });
  }, [boardId, layer.id, deleteLayerApi]);

  const renderDragHandle = () => {
    if (userRole === "Viewer") return null;
    return (
      <Box {...attributes} {...listeners} sx={{ cursor: "grab", display: "flex" }}>
        <DragHandleIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }} />
      </Box>
    );
  };

  const renderNameSection = () => {
    if (isEditing) {
      return (
        <TextField
          size="small"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRenameComplete}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameComplete();
            if (e.key === "Escape") setIsEditing(false);
          }}
          autoFocus
          variant="standard"
          slotProps={{
            input: {
              sx: {
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
                padding: "2px 4px"
              }
            }
          }}
          sx={{ flex: 1 }}
        />
      );
    }

    return (
      <LayerName onDoubleClick={handleDoubleClick}>
        {layer.name}
      </LayerName>
    );
  };

  const renderVisibilityButton = () => (
    <Tooltip title={layer.isVisible ? "Hide layer" : "Show layer"} arrow>
      <SmallIconButton onClick={handleToggleVisibility} size="small">
        {layer.isVisible
          ? <VisibilityIcon sx={{ fontSize: 16 }} />
          : <VisibilityOffIcon sx={{ fontSize: 16 }} />
        }
      </SmallIconButton>
    </Tooltip>
  );

  const renderLockButton = () => {
    if (!canLock) {
      if (layer.isLocked) return <LockIndicator />;
      return null;
    }

    return (
      <Tooltip title={layer.isLocked ? "Unlock layer" : "Lock layer"} arrow>
        <SmallIconButton onClick={handleToggleLock} size="small">
          {layer.isLocked
            ? <LockIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
            : <LockOpenIcon sx={{ fontSize: 16 }} />
          }
        </SmallIconButton>
      </Tooltip>
    );
  };

  const renderDeleteButton = () => {
    if (!canEdit) return null;

    return (
      <Tooltip title={isLast ? "Cannot delete last layer" : "Delete layer"} arrow>
        <span>
          <SmallIconButton
            onClick={handleDelete}
            size="small"
            disabled={isLast}
            sx={{ "&:hover": { color: "#ef4444" } }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
          </SmallIconButton>
        </span>
      </Tooltip>
    );
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LayerRowContainer
        isActive={isActive}
        onClick={() => onSelect(layer.id)}
      >
        {renderDragHandle()}
        {renderNameSection()}
        {renderVisibilityButton()}
        {renderLockButton()}
        {renderDeleteButton()}
      </LayerRowContainer>
    </div>
  );
};

interface LayersPanelProps {
  boardId: string;
  userRole: UserRole;
  onClose: () => void;
}

export const LayersPanel = ({ boardId, userRole, onClose }: LayersPanelProps) => {
  const dispatch = useDispatch();
  const layers = useSelector((state: RootState) => state.layers.layers);
  const activeLayerId = useSelector((state: RootState) => state.layers.activeLayerId);
  const [createLayerApi] = useCreateLayerMutation();
  const [reorderLayersApi] = useReorderLayersMutation();

  const canEdit = userRole === "Owner" || userRole === "Collaborator";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSelectLayer = useCallback((layerId: string) => {
    dispatch(setActiveLayer(layerId));
  }, [dispatch]);

  const handleAddLayer = useCallback(() => {
    const existingNumbers = layers
      .map((l) => l.name.match(/^Layer (\d+)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => parseInt(m[1], 10));
    const nextNumber = existingNumbers.length > 0
      ? Math.max(...existingNumbers) + 1
      : layers.length + 1;
    createLayerApi({ boardId, name: `Layer ${nextNumber}` });
  }, [boardId, layers, createLayerApi]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = layers.findIndex((l) => l.id === active.id);
    const newIndex = layers.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...layers];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const totalLayers = reordered.length;
    const orderedLayerIds = reordered.map((l, index) => ({
      id: l.id,
      order: totalLayers - 1 - index
    }));

    reorderLayersApi({
      boardId,
      orderedLayerIds: orderedLayerIds
        .sort((a, b) => a.order - b.order)
        .map((l) => l.id)
    });
  }, [layers, boardId, reorderLayersApi]);

  const sortedLayerIds = layers.map((l) => l.id);

  const renderHeaderActions = () => {
    return (
      <HeaderActions>
        {canEdit && (
          <Tooltip title="Add layer" arrow>
            <SmallIconButton onClick={handleAddLayer} size="small">
              <AddIcon sx={{ fontSize: 18 }} />
            </SmallIconButton>
          </Tooltip>
        )}
        <Tooltip title="Close" arrow>
          <SmallIconButton onClick={onClose} size="small">
            <CloseIcon sx={{ fontSize: 18 }} />
          </SmallIconButton>
        </Tooltip>
      </HeaderActions>
    );
  };

  return (
    <PanelContainer>
      <PanelHeader>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
          Layers
        </Typography>
        {renderHeaderActions()}
      </PanelHeader>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortedLayerIds} strategy={verticalListSortingStrategy}>
          {layers.map((layer) => (
            <SortableLayerRow
              key={layer.id}
              layer={layer}
              isActive={layer.id === activeLayerId}
              userRole={userRole}
              isLast={layers.length <= 1}
              boardId={boardId}
              onSelect={handleSelectLayer}
            />
          ))}
        </SortableContext>
      </DndContext>
    </PanelContainer>
  );
};
