import { Tooltip, IconButton, Box, Divider } from "@mui/material";
import RectangleOutlinedIcon from "@mui/icons-material/RectangleOutlined";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import { styled } from "@mui/material/styles";

interface Props {
  onRectangle: () => void;
  onCircle: () => void;
  onTriangle: () => void;
  onLine: () => void;
  onText: () => void;
  onSticky: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  hasSelection: boolean;
  onToggleLayers: () => void;
  isLayersOpen: boolean;
  isLayerLocked?: boolean;
}

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "danger" && prop !== "activeItem"
})<{ danger?: boolean; activeItem?: boolean }>(({ danger, activeItem }) => ({
  color: activeItem ? "#6366f1" : (danger ? "#ef4444" : "rgba(255,255,255,0.85)"),
  background: activeItem ? "rgba(99,102,241,0.25)" : "transparent",
  borderRadius: "10px",
  transition: "all 0.2s ease",
  "&:hover": {
    background: danger ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.25)",
    color: danger ? "#ef4444" : "#a5b4fc",
    transform: "scale(1.1)",
  },
  "&:disabled": {
    color: "rgba(255,255,255,0.2)",
  },
}));

const ToolbarContainer = styled(Box)({
  position: "absolute",
  top: "50%",
  left: 16,
  transform: "translateY(-50%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  background: "rgba(15, 23, 42, 0.75)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "12px 8px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  zIndex: 100,
});

const StyledDivider = styled(Divider)({
  width: "100%",
  borderColor: "rgba(255,255,255,0.08)",
  margin: "4px 0"
});

const ToolBtn = ({
  title,
  onClick,
  children,
  disabled = false,
  danger = false,
  activeItem = false,
  toolType,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  activeItem?: boolean;
  toolType?: string;
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    if (toolType) {
      e.dataTransfer.setData("application/react-whiteboard-tool", toolType);
      e.dataTransfer.effectAllowed = "copy";
      
      const dragIcon = document.createElement('div');
      dragIcon.style.position = 'absolute';
      dragIcon.style.top = '-1000px';
      dragIcon.innerHTML = `
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.4);
          border: 2px solid #818cf8;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
          backdrop-filter: blur(8px);
        ">
          ${e.currentTarget.innerHTML}
        </div>
      `;
      document.body.appendChild(dragIcon);
      e.dataTransfer.setDragImage(dragIcon, 24, 24);
      
      setTimeout(() => {
        if (dragIcon.parentNode) {
          dragIcon.parentNode.removeChild(dragIcon);
        }
      }, 0);
    }
  };

  return (
    <Tooltip title={title} placement="right" arrow>
      <span>
        <StyledIconButton
          onClick={() => onClick()}
          disabled={disabled}
          size="medium"
          danger={danger}
          activeItem={activeItem}
          draggable={!!toolType}
          onDragStart={handleDragStart}
        >
          {children}
        </StyledIconButton>
      </span>
    </Tooltip>
  );
};

import LayersIcon from "@mui/icons-material/Layers";

export const Toolbar = ({
  onRectangle,
  onCircle,
  onTriangle,
  onLine,
  onText,
  onSticky,
  onDelete,
  onUndo,
  onRedo,
  hasSelection,
  onToggleLayers,
  isLayersOpen,
  isLayerLocked = false,
}: Props) => {
  return (
    <ToolbarContainer>
      <ToolBtn title="Rectangle (R)" onClick={onRectangle} toolType="rectangle" disabled={isLayerLocked}>
        <RectangleOutlinedIcon fontSize="small" />
      </ToolBtn>
      <ToolBtn title="Circle (C)" onClick={onCircle} toolType="circle" disabled={isLayerLocked}>
        <CircleOutlinedIcon fontSize="small" />
      </ToolBtn>
      <ToolBtn title="Triangle" onClick={onTriangle} toolType="triangle" disabled={isLayerLocked}>
        <ChangeHistoryIcon fontSize="small" />
      </ToolBtn>
      <ToolBtn title="Line" onClick={onLine} toolType="line" disabled={isLayerLocked}>
        <HorizontalRuleIcon fontSize="small" />
      </ToolBtn>
      <ToolBtn title="Text (T)" onClick={onText} toolType="text" disabled={isLayerLocked}>
        <TextFieldsIcon fontSize="small" />
      </ToolBtn>
      <ToolBtn title="Sticky Note" onClick={onSticky} toolType="sticky" disabled={isLayerLocked}>
        <StickyNote2OutlinedIcon fontSize="small" />
      </ToolBtn>

      <StyledDivider />

      <ToolBtn title="Delete (Del)" onClick={onDelete} disabled={!hasSelection || isLayerLocked} danger>
        <DeleteOutlineIcon fontSize="small" />
      </ToolBtn>
      <ToolBtn title="Undo (Ctrl+Z)" onClick={onUndo} disabled={isLayerLocked}>
        <UndoIcon fontSize="small" />
      </ToolBtn>
      <ToolBtn title="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={isLayerLocked}>
        <RedoIcon fontSize="small" />
      </ToolBtn>

      <StyledDivider />

      <ToolBtn 
        title="Layers" 
        onClick={onToggleLayers} 
        activeItem={isLayersOpen}
      >
        <LayersIcon fontSize="small" />
      </ToolBtn>
    </ToolbarContainer>
  );
};