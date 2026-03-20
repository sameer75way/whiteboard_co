import { Tooltip, IconButton, Box, Divider, Menu, Typography, TextField } from "@mui/material";
import RectangleOutlinedIcon from "@mui/icons-material/RectangleOutlined";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import HistoryIcon from "@mui/icons-material/History";
import SaveIcon from "@mui/icons-material/Save";
import GifBoxOutlinedIcon from "@mui/icons-material/GifBoxOutlined";
import { styled } from "@mui/material/styles";
import LayersIcon from "@mui/icons-material/Layers";
import { ConnectionStatusBar } from "../Sync/ConnectionStatusBar";
import { useEffect, useMemo, useState } from "react";
import type { StickerPreset } from "../../../../lib/utils/canvas.utils";

declare global {
  interface Window {
    __WBC_DRAG_TOOL?: { toolType: string; toolPayload?: string };
  }
}

interface GiphyGif {
  id: string;
  url: string;
  previewUrl: string;
}

const EMOJI_PRESETS = ["😀", "😎", "😍", "🔥", "🎯", "🚀", "💡", "✅", "👏", "🤔", "🎉", "❤️"];

const STICKER_PRESETS: StickerPreset[] = [
  { symbol: "⭐", fill: "#fef3c7", stroke: "#f59e0b" },
  { symbol: "❤️", fill: "#fee2e2", stroke: "#ef4444" },
  { symbol: "👍", fill: "#dbeafe", stroke: "#3b82f6" },
  { symbol: "✅", fill: "#dcfce7", stroke: "#22c55e" },
  { symbol: "💡", fill: "#fef9c3", stroke: "#eab308" },
  { symbol: "🎯", fill: "#f3e8ff", stroke: "#a855f7" },
  { symbol: "❗", fill: "#ffedd5", stroke: "#f97316" },
  { symbol: "❓", fill: "#e0f2fe", stroke: "#0ea5e9" },
  { symbol: "🚀", fill: "#ede9fe", stroke: "#6366f1" }
];

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || "dc6zaTOxFJmzC";
const GIF_FALLBACK_URL = "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif";

interface Props {
  boardId: string;
  onRectangle: () => void;
  onCircle: () => void;
  onTriangle: () => void;
  onLine: () => void;
  onText: () => void;
  onSticky: () => void;
  onSticker: (preset?: StickerPreset) => void;
  onEmoji: (emoji?: string) => void;
  onGif: (gifUrl?: string) => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  hasSelection: boolean;
  onToggleLayers: () => void;
  isLayersOpen: boolean;
  isLayerLocked?: boolean;
  onToggleHistory: () => void;
  isHistoryOpen: boolean;
  onSaveVersion: () => void;
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

const PickerGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 8,
  width: 220,
  padding: 8
});

const PickerTitle = styled(Typography)({
  fontSize: 12,
  color: "#94a3b8",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  padding: "10px 12px 0"
});

const GifSearchBox = styled(Box)({
  padding: "10px 12px 4px"
});

const GifGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
  width: 280,
  maxHeight: 320,
  overflowY: "auto",
  padding: 8
});

const GifPickButton = styled("button")({
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 10,
  padding: 0,
  background: "#0f172a",
  overflow: "hidden",
  cursor: "pointer",
  lineHeight: 0,
  transition: "transform 0.15s ease, border-color 0.15s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    borderColor: "#6366f1"
  }
});

const GifThumb = styled("img")({
  width: "100%",
  height: 100,
  objectFit: "cover",
  display: "block"
});

const EmojiPickButton = styled(IconButton)({
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.24)",
  fontSize: 22,
  lineHeight: 1,
  height: 44,
  width: 44,
  background: "#0f172a",
  transition: "transform 0.15s ease, border-color 0.15s ease",
  "&:hover": {
    transform: "scale(1.08)",
    borderColor: "#6366f1"
  }
});

const StickerPickButton = styled(IconButton)<{ $fill: string; $stroke: string }>(({ $fill, $stroke }) => ({
  borderRadius: 12,
  border: `2px solid ${$stroke}`,
  color: "#111827",
  fontSize: 20,
  lineHeight: 1,
  height: 46,
  width: 46,
  background: $fill,
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
  "&:hover": {
    transform: "translateY(-1px) scale(1.04)",
    boxShadow: "0 6px 14px rgba(15,23,42,0.25)"
  }
}));

const ToolBtn = ({
  title,
  onClick,
  children,
  disabled = false,
  danger = false,
  activeItem = false,
  toolType,
  toolPayload,
}: {
  title: string;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  activeItem?: boolean;
  toolType?: string;
  toolPayload?: string;
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    if (toolType) {
      e.dataTransfer.setData("application/react-whiteboard-tool", toolType);
      if (toolPayload) {
        e.dataTransfer.setData("application/react-whiteboard-tool-payload", toolPayload);
      }
      e.dataTransfer.setData("text/plain", JSON.stringify({ toolType, toolPayload }));
      window.__WBC_DRAG_TOOL = { toolType, toolPayload };
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
          onClick={onClick}
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

export const Toolbar = ({
  boardId,
  onRectangle,
  onCircle,
  onTriangle,
  onLine,
  onText,
  onSticky,
  onSticker,
  onEmoji,
  onGif,
  onDelete,
  onUndo,
  onRedo,
  hasSelection,
  onToggleLayers,
  isLayersOpen,
  isLayerLocked = false,
  onToggleHistory,
  isHistoryOpen,
  onSaveVersion,
}: Props) => {
  const [emojiAnchor, setEmojiAnchor] = useState<null | HTMLElement>(null);
  const [stickerAnchor, setStickerAnchor] = useState<null | HTMLElement>(null);
  const [gifAnchor, setGifAnchor] = useState<null | HTMLElement>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>(EMOJI_PRESETS[0]);
  const [selectedSticker, setSelectedSticker] = useState<StickerPreset>(STICKER_PRESETS[0]);
  const [selectedGif, setSelectedGif] = useState<string>("");
  const [gifSearch, setGifSearch] = useState("");
  const [gifItems, setGifItems] = useState<GiphyGif[]>([]);
  const [gifLoading, setGifLoading] = useState(false);

  const normalizedSearch = useMemo(() => gifSearch.trim(), [gifSearch]);

  const openEmojiPicker = (event: React.MouseEvent<HTMLElement>) => {
    setStickerAnchor(null);
    setGifAnchor(null);
    setEmojiAnchor(event.currentTarget);
  };

  const openStickerPicker = (event: React.MouseEvent<HTMLElement>) => {
    setEmojiAnchor(null);
    setGifAnchor(null);
    setStickerAnchor(event.currentTarget);
  };

  const openGifPicker = (event: React.MouseEvent<HTMLElement>) => {
    setEmojiAnchor(null);
    setStickerAnchor(null);
    setGifAnchor(event.currentTarget);
  };

  const closeEmojiPicker = () => setEmojiAnchor(null);
  const closeStickerPicker = () => setStickerAnchor(null);
  const closeGifPicker = () => setGifAnchor(null);

  useEffect(() => {
    let isCancelled = false;

    const bootstrapDefaultGif = async () => {
      try {
        const endpoint = `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(GIPHY_API_KEY)}&limit=1&rating=pg`;
        const response = await fetch(endpoint);
        const json = await response.json() as { data?: Array<{ images?: { fixed_width?: { url?: string } } }> };
        const defaultGif = json.data?.[0]?.images?.fixed_width?.url;
        if (!isCancelled && defaultGif) {
          setSelectedGif(defaultGif);
        }
      } catch {
        // Keep empty default; users can still pick from the GIF menu.
      }
    };

    bootstrapDefaultGif();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!gifAnchor) return;

    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setGifLoading(true);
        const endpoint = normalizedSearch
          ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(GIPHY_API_KEY)}&q=${encodeURIComponent(normalizedSearch)}&limit=24&rating=pg`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(GIPHY_API_KEY)}&limit=24&rating=pg`;
        const response = await fetch(endpoint);
        const json = await response.json() as { data?: Array<{ id: string; images?: { fixed_width?: { url?: string }; fixed_width_still?: { url?: string } } }> };
        if (isCancelled) return;

        const nextItems: GiphyGif[] = (json.data || [])
          .map((item) => ({
            id: item.id,
            url: item.images?.fixed_width?.url || "",
            previewUrl: item.images?.fixed_width_still?.url || item.images?.fixed_width?.url || ""
          }))
          .filter((item) => item.url && item.previewUrl);

        setGifItems(nextItems);
        if (!selectedGif && nextItems.length > 0) {
          setSelectedGif(nextItems[0].url);
        }
      } catch {
        if (!isCancelled) {
          setGifItems([]);
        }
      } finally {
        if (!isCancelled) {
          setGifLoading(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [gifAnchor, normalizedSearch, selectedGif]);

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
      <ToolBtn
        title="Sticker"
        onClick={openStickerPicker}
        toolType="sticker"
        toolPayload={JSON.stringify(selectedSticker)}
        disabled={isLayerLocked}
      >
        <StyleOutlinedIcon fontSize="small" />
      </ToolBtn>
      <ToolBtn
        title="Emoji"
        onClick={openEmojiPicker}
        toolType="emoji"
        toolPayload={selectedEmoji}
        disabled={isLayerLocked}
      >
        <EmojiEmotionsOutlinedIcon fontSize="small" />
      </ToolBtn>
      <ToolBtn
        title="GIF"
        onClick={openGifPicker}
        toolType="gif"
        toolPayload={selectedGif || GIF_FALLBACK_URL}
        disabled={isLayerLocked}
      >
        <GifBoxOutlinedIcon fontSize="small" />
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
      <ToolBtn
        title="Version History"
        onClick={onToggleHistory}
        activeItem={isHistoryOpen}
      >
        <HistoryIcon fontSize="small" />
      </ToolBtn>
      <ToolBtn
        title="Save Version"
        onClick={onSaveVersion}
      >
        <SaveIcon fontSize="small" />
      </ToolBtn>

      <StyledDivider />

      <ConnectionStatusBar boardId={boardId} />

      <Menu
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={closeEmojiPicker}
        anchorOrigin={{ horizontal: "right", vertical: "center" }}
        transformOrigin={{ horizontal: "left", vertical: "center" }}
      >
        <PickerTitle>Emoji Picker</PickerTitle>
        <PickerGrid>
          {EMOJI_PRESETS.map((emoji) => (
            <EmojiPickButton
              key={emoji}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/react-whiteboard-tool", "emoji");
                e.dataTransfer.setData("application/react-whiteboard-tool-payload", emoji);
                e.dataTransfer.setData("text/plain", JSON.stringify({ toolType: "emoji", toolPayload: emoji }));
                window.__WBC_DRAG_TOOL = { toolType: "emoji", toolPayload: emoji };
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => {
                setSelectedEmoji(emoji);
                onEmoji(emoji);
                closeEmojiPicker();
              }}
            >
              {emoji}
            </EmojiPickButton>
          ))}
        </PickerGrid>
      </Menu>

      <Menu
        open={Boolean(stickerAnchor)}
        anchorEl={stickerAnchor}
        onClose={closeStickerPicker}
        anchorOrigin={{ horizontal: "right", vertical: "center" }}
        transformOrigin={{ horizontal: "left", vertical: "center" }}
      >
        <PickerTitle>Sticker Picker</PickerTitle>
        <PickerGrid>
          {STICKER_PRESETS.map((preset) => (
            <StickerPickButton
              key={`${preset.symbol}-${preset.fill}`}
              $fill={preset.fill}
              $stroke={preset.stroke}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/react-whiteboard-tool", "sticker");
                const serializedPreset = JSON.stringify(preset);
                e.dataTransfer.setData("application/react-whiteboard-tool-payload", serializedPreset);
                e.dataTransfer.setData("text/plain", JSON.stringify({ toolType: "sticker", toolPayload: serializedPreset }));
                window.__WBC_DRAG_TOOL = { toolType: "sticker", toolPayload: serializedPreset };
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => {
                setSelectedSticker(preset);
                onSticker(preset);
                closeStickerPicker();
              }}
            >
              {preset.symbol}
            </StickerPickButton>
          ))}
        </PickerGrid>
      </Menu>

      <Menu
        open={Boolean(gifAnchor)}
        anchorEl={gifAnchor}
        onClose={closeGifPicker}
        anchorOrigin={{ horizontal: "right", vertical: "center" }}
        transformOrigin={{ horizontal: "left", vertical: "center" }}
      >
        <PickerTitle>Giphy GIFs</PickerTitle>
        <GifSearchBox>
          <TextField
            size="small"
            fullWidth
            placeholder="Search GIFs"
            value={gifSearch}
            onChange={(e) => setGifSearch(e.target.value)}
          />
        </GifSearchBox>
        <GifGrid>
          {gifItems.map((gif) => (
            <GifPickButton
              key={gif.id}
              onClick={() => {
                setSelectedGif(gif.url);
                onGif(gif.url);
                closeGifPicker();
              }}
              onDragStart={(e) => {
                e.dataTransfer.setData("application/react-whiteboard-tool", "gif");
                e.dataTransfer.setData("application/react-whiteboard-tool-payload", gif.url);
                e.dataTransfer.setData("text/plain", JSON.stringify({ toolType: "gif", toolPayload: gif.url }));
                window.__WBC_DRAG_TOOL = { toolType: "gif", toolPayload: gif.url };
                e.dataTransfer.effectAllowed = "copy";
              }}
              draggable
              type="button"
            >
              <GifThumb src={gif.previewUrl} alt="gif" />
            </GifPickButton>
          ))}
        </GifGrid>
        {!gifLoading && gifItems.length === 0 && (
          <Typography variant="caption" sx={{ px: 1.5, pb: 1.5, display: "block", color: "text.secondary" }}>
            No GIFs found
          </Typography>
        )}
      </Menu>
    </ToolbarContainer>
  );
};