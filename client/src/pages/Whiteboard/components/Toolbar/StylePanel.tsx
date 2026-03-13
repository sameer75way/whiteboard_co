import { useState } from "react";
import { Box, Typography, Divider, Slider } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../../store/index";
import { updateElement } from "../../../../store/canvas/canvasSlice";
import { socket } from "../../../../services/socket/socketClient";
import { db } from "../../../../services/offline/offlineDB";
import { nextLamport } from "../../../../lib/utils/crdt";
import { StyleIcon } from "../../../../assets/svg/StyleIcon";
import { CloseSvgIcon } from "../../../../assets/svg/CloseSvgIcon";

const PanelContainer = styled(Box)({
  position: "absolute",
  top: 80,
  right: 16,
  width: 280,
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  background: "rgba(15, 23, 42, 0.85)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  color: "#f8fafc",
  zIndex: 100
});

const SectionTitle = styled(Typography)({
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#94a3b8",
  marginBottom: "8px",
});

const ColorGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "8px",
});

const ColorButton = styled("button")<{ $color: string; $selected: boolean; $isTransparent?: boolean }>(
  ({ $color, $selected, $isTransparent }) => ({
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: $color,
    border: $selected ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    outline: "none",
    transition: "transform 0.1s ease",
    "&:hover": {
      transform: "scale(1.1)",
    },
    ...($isTransparent && {
      backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
      backgroundSize: "8px 8px",
      backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
      backgroundColor: "#fff",
    })
  })
);

const ClosedPanelContainer = styled(Box)({
  position: "absolute",
  top: 80,
  right: 16,
  zIndex: 100,
});

const ToggleButton = styled(Box)({
  width: 48,
  height: 48,
  borderRadius: "12px",
  background: "rgba(15, 23, 42, 0.85)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#6366f1",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)",
    background: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(99, 102, 241, 0.4)",
  }
});

const TitleNoMargin = styled(SectionTitle)({
  marginBottom: 0
});

const CloseButton = styled(Box)({
  cursor: "pointer",
  color: "#94a3b8",
  "&:hover": { color: "#fff" }
});

const StyledDivider = styled(Divider)({
  borderColor: "rgba(255,255,255,0.08)"
});

const StyledSlider = styled(Slider)({
  color: "#6366f1"
});

const StrokeWidthButton = styled('button')<{ $selected: boolean }>(({ $selected }) => ({
  background: $selected ? "rgba(99,102,241,0.25)" : "transparent",
  border: "1px solid rgba(255,255,255,0.2)",
  color: $selected ? "#a5b4fc" : "#cbd5e1",
  borderRadius: "4px",
  padding: "2px 8px",
  cursor: "pointer",
}));

const PRESET_COLORS = [
  "transparent",
  "#ffffff",
  "#000000",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#64748b",
  "#fef08a",
];

const PRESET_STROKES = [1, 2, 4, 8, 12];

export const StylePanel = ({ boardId }: { boardId: string }) => {
  const dispatch = useDispatch();
  const selectedElementId = useSelector((state: RootState) => state.canvas.selectedElementId);
  const elements = useSelector((state: RootState) => state.canvas.elements);
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  const element = selectedElementId ? elements[selectedElementId] : null;

  if (!element || element.type === "sticky") return null;

  const handleUpdate = async (updates: Partial<typeof element.style>) => {
    const lamportTs = nextLamport();
    const elementWithTs = { 
      ...element, 
      style: { ...element.style, ...updates },
      version: element.version + 1,
      lamportTs 
    };
    
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
  };

  if (!isExpanded) {
    return (
      <ClosedPanelContainer>
        <ToggleButton onClick={() => setIsExpanded(true)}>
          <StyleIcon />
        </ToggleButton>
      </ClosedPanelContainer>
    );
  }

  return (
    <PanelContainer>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <TitleNoMargin>Styles</TitleNoMargin>
        <CloseButton onClick={() => setIsExpanded(false)}>
          <CloseSvgIcon />
        </CloseButton>
      </Box>

      <Box>
        <SectionTitle>Stroke Color</SectionTitle>
        <ColorGrid>
          {PRESET_COLORS.map(color => (
            <ColorButton
              key={`stroke-${color}`}
              $color={color}
              $isTransparent={color === "transparent"}
              $selected={element.style.stroke === color}
              onClick={() => handleUpdate({ stroke: color })}
            />
          ))}
        </ColorGrid>
      </Box>

      <StyledDivider />

      <Box>
        <SectionTitle>Fill Color</SectionTitle>
        <ColorGrid>
          {PRESET_COLORS.map(color => (
            <ColorButton
              key={`fill-${color}`}
              $color={color}
              $isTransparent={color === "transparent"}
              $selected={element.style.fill === color}
              onClick={() => handleUpdate({ fill: color })}
            />
          ))}
        </ColorGrid>
      </Box>

      <StyledDivider />

      <Box>
        <SectionTitle>Stroke Width: {element.style.strokeWidth}px</SectionTitle>
        <StyledSlider
          value={element.style.strokeWidth}
          min={0}
          max={24}
          step={1}
          onChange={(_, value) => handleUpdate({ strokeWidth: value as number })}
        />
        <Box display="flex" gap={1} flexWrap="wrap">
          {PRESET_STROKES.map(w => (
            <StrokeWidthButton
              key={`width-${w}`}
              onClick={() => handleUpdate({ strokeWidth: w })}
              $selected={element.style.strokeWidth === w}
            >
              {w}
            </StrokeWidthButton>
          ))}
        </Box>
      </Box>

      <StyledDivider />

      <Box>
        <SectionTitle>Opacity: {Math.round(element.style.opacity * 100)}%</SectionTitle>
        <StyledSlider
          value={element.style.opacity}
          min={0.1}
          max={1}
          step={0.05}
          onChange={(_, value) => handleUpdate({ opacity: value as number })}
        />
      </Box>
    </PanelContainer>
  );
};

