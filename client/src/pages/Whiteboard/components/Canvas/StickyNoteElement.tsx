import { useRef, useState, useEffect } from "react";
import { Group, Rect, Image as KonvaImage, Text } from "react-konva";
import { Html } from "react-konva-utils";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import { Box, styled, IconButton, Tooltip } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store/index";

import type { CanvasElement } from "../../../../types/element.types";
import { store } from "../../../../store/index";
import { updateElement, selectElement } from "../../../../store/canvas/canvasSlice";
import { setActiveStickyNote } from "../../../../store/comments/commentsSlice";
import { socket } from "../../../../services/socket/socketClient";
import { db } from "../../../../services/offline/offlineDB";
import { nextLamport } from "../../../../lib/utils/crdt";

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  isDisabled: boolean;
  shapeRef?: React.RefObject<Konva.Group>;
  onMouseDown?: (e: KonvaEventObject<MouseEvent>) => void;
  onTouchStart?: (e: KonvaEventObject<TouchEvent>) => void;
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
  onTransform?: (e: KonvaEventObject<Event>) => void;
  onTransformEnd?: (e: KonvaEventObject<Event>) => void;
  onContextMenu?: (e: KonvaEventObject<PointerEvent>) => void;
}

const COLORS = ["#FFF9C4", "#FFCDD2", "#C8E6C9", "#BBDEFB", "#E1BEE7"];
const MAX_LIMIT = 250;

const OuterWrapper = styled("div", {
  shouldForwardProp: (prop) => prop !== "$width" && prop !== "$height"
})<{ $width: number; $height: number }>(({ $width, $height }) => ({
  position: "relative",
  width: `${$width}px`,
  height: `${$height}px`
}));

const ToolbarContainer = styled(Box)({
  position: "absolute",
  top: "-45px",
  left: 0,
  background: "#1e293b",
  borderRadius: "8px",
  padding: "4px 8px",
  display: "flex",
  gap: "4px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  zIndex: 100,
  alignItems: "center",
  pointerEvents: "auto"
});

const ColorBadge = styled("div")<{ bg: string }>(({ bg }) => ({
  width: 16,
  height: 16,
  borderRadius: "50%",
  background: bg,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.2)",
  "&:hover": {
    transform: "scale(1.1)"
  }
}));

const StyledEditorBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "dynamicFontSize"
})<{ dynamicFontSize: number }>(({ dynamicFontSize }) => ({
  width: "100%",
  flex: 1,
  boxSizing: "border-box",
  cursor: "text",
  overflow: "hidden",
  padding: "0 4px",
  "& .ProseMirror": {
    outline: "none",
    minHeight: "100%",
    fontSize: `${dynamicFontSize}px`,
    fontFamily: "'Inter', sans-serif",
    color: "#333",
    lineHeight: 1.5,
    "& p": {
      margin: 0
    },
    "& ul": {
      marginTop: 0,
      marginBottom: 0,
      paddingLeft: "1.2rem"
    }
  }
}));

const ContentArea = styled("div", {
  shouldForwardProp: (prop) => prop !== "$isEditing"
})<{ $isEditing: boolean }>(({ $isEditing }) => ({
  width: "100%",
  height: "100%",
  padding: "16px 12px 12px 12px",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  overflow: "hidden",
  opacity: $isEditing ? 1 : 0
}));

const HeadingInput = styled("input")({
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px dashed rgba(0,0,0,0.15)",
  outline: "none",
  fontSize: "13px",
  fontWeight: 700,
  padding: "0 0 4px 0",
  marginBottom: "6px",
  fontFamily: "'Inter', sans-serif",
  color: "rgba(0,0,0,0.85)",
  pointerEvents: "auto",
  "&::placeholder": {
    color: "rgba(0,0,0,0.3)"
  },
  "&:disabled": {
    color: "rgba(0,0,0,0.85)",
    borderBottom: "1px solid transparent"
  }
});

const ToolbarButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "isActive"
})<{ isActive?: boolean }>(({ isActive }) => ({
  color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
  "&:hover": {
    backgroundColor: isActive ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"
  }
}));

const ToolbarDivider = styled(Box)({
  width: "1px",
  height: "20px",
  background: "rgba(255,255,255,0.2)",
  margin: "0 8px"
});

export const StickyNoteElement = ({
  element,
  isSelected,
  isDisabled,
  shapeRef,
  ...props
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const localShapeRef = useRef<Konva.Group>(null);
  const elementRef = useRef(element);
  const lastCursorEmitRef = useRef<number>(0);

  useEffect(() => {
    elementRef.current = element;
  }, [element]);

  const currentRef = shapeRef || localShapeRef;

  const activeStickyNoteId = useSelector((state: RootState) => state.comments.activeStickyNoteId);

  const bgColor = (element.data?.backgroundColor as string) || element.style.fill;
  const richContent = element.data?.richContent || { type: "doc", content: [{ type: "paragraph" }] };
  const heading = (element.data?.heading as string) || "";

  const [localHeading, setLocalHeading] = useState(heading);
  const [charCount, setCharCount] = useState(0);
  const [renderedImage, setRenderedImage] = useState<HTMLImageElement | null>(null);
  const [isBadgeHovered, setIsBadgeHovered] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setLocalHeading(heading);
    }
  }, [heading, isEditing]);

  const getFontSize = (chars: number) => {
    if (chars < 40) return 20;
    if (chars < 100) return 16;
    if (chars < 180) return 14;
    return 12;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({ limit: MAX_LIMIT })
    ],
    content: richContent,
    editable: !isDisabled,
    onUpdate: ({ editor: ed }) => {
      setCharCount(ed.storage.characterCount.characters());
      saveContent(ed.getJSON());
    },
    onBlur: ({ editor: ed }) => {
      saveContent(ed.getJSON());
      setIsEditing(false);
    }
  });

  useEffect(() => {
    if (!isSelected && isEditing) {
      setIsEditing(false);
      changeHeading(localHeading);
      if (editor) {
        saveContent(editor.getJSON());
      }
    }
  }, [isSelected, isEditing, editor, localHeading]);

  useEffect(() => {
    if (editor && !isEditing && JSON.stringify(editor.getJSON()) !== JSON.stringify(richContent)) {
      editor.commands.setContent(richContent);
    }
  }, [richContent, editor, isEditing]);

  useEffect(() => {
    if (editor) {
      setCharCount(editor.storage.characterCount.characters());
    }
  }, [editor]);

  useEffect(() => {
    if (isEditing || !editor) return;

    const htmlContent = editor.getHTML();

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${element.dimensions.width}" height="${element.dimensions.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: sans-serif; font-size: ${getFontSize(charCount)}px; color: #333; line-height: 1.5; padding: 16px 12px 12px 12px; box-sizing: border-box; width: 100%; height: 100%; display: flex; flex-direction: column;">
            ${localHeading ? `<div style="border-bottom: 1px dashed rgba(0,0,0,0.15); font-weight: 700; font-size: 13px; margin-bottom: 6px; padding-bottom: 4px; color: rgba(0,0,0,0.85);">${localHeading}</div>` : ''}
            <div style="margin: 0; padding: 0 4px; overflow: hidden; flex: 1;">
              <style>
                p { margin: 0; }
                ul { margin-top: 0; margin-bottom: 0; padding-left: 1.2rem; }
              </style>
              ${htmlContent}
            </div>
          </div>
        </foreignObject>
      </svg>
    `;

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const img = new window.Image();
    img.onload = () => {
      setRenderedImage(img);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [localHeading, charCount, editor, isEditing, element.dimensions.width, element.dimensions.height, richContent]);

  const syncUpdate = async (updates: Partial<typeof element>) => {
    const el = elementRef.current;
    const lamportTs = nextLamport();
    const elementWithTs = {
      ...el,
      ...updates,
      version: el.version + 1,
      lamportTs
    };
    
    store.dispatch(updateElement(elementWithTs));
    
    if (navigator.onLine) {
      socket.emit("element:update", {
        boardId: el.boardId || "",
        elementId: el._id,
        payload: elementWithTs
      });
    } else {
      db.operations.add({
        boardId: el.boardId || "",
        elementId: el._id,
        operation: "update",
        payload: elementWithTs,
        clientVersion: el.version,
        lamportTs
      });
    }
  };

  const saveContent = (jsonContent: JSONContent) => {
    const el = elementRef.current;
    syncUpdate({
      data: {
        ...el.data,
        richContent: jsonContent
      }
    });
  };

  const changeColor = (color: string) => {
    const el = elementRef.current;
    syncUpdate({
      style: { ...el.style, fill: color },
      data: { ...el.data, backgroundColor: color }
    });
  };

  const changeHeading = (newHeading: string) => {
    const el = elementRef.current;
    syncUpdate({
      data: { ...el.data, heading: newHeading }
    });
  };

  const handleDblClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isDisabled) return;
    e.cancelBubble = true;
    setIsEditing(true);
    setTimeout(() => {
      editor?.commands.focus("end");
    }, 50);
  };

  const handleCommentClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true;
    if (activeStickyNoteId === element._id) {
      store.dispatch(setActiveStickyNote(null));
    } else {
      store.dispatch(setActiveStickyNote(element._id));
    }
  };

  const handleSelect = (e: KonvaEventObject<MouseEvent>) => {
    if (!isSelected) {
      store.dispatch(selectElement(element._id));
    }
    if (props.onMouseDown) props.onMouseDown(e);
  };

  const handleTouch = (e: KonvaEventObject<TouchEvent>) => {
    if (!isSelected) {
      store.dispatch(selectElement(element._id));
    }
    if (props.onTouchStart) props.onTouchStart(e);
  };

  const renderToolbar = () => {
    if (!isEditing) return null;
    return (
      <ToolbarContainer onMouseDown={(e) => e.preventDefault()}>
        <Tooltip title="Bold">
          <ToolbarButton
            size="small"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive("bold")}
          >
            <FormatBoldIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Italic">
          <ToolbarButton
            size="small"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive("italic")}
          >
            <FormatItalicIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Bullet List">
          <ToolbarButton
            size="small"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive("bulletList")}
          >
            <FormatListBulletedIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>
        <ToolbarDivider />
        {COLORS.map((color) => (
          <ColorBadge key={color} bg={color} onClick={() => changeColor(color)} />
        ))}
      </ToolbarContainer>
    );
  };

  const renderHeading = () => (
    <HeadingInput
      value={localHeading}
      placeholder="Sticky note"
      onChange={(e) => setLocalHeading(e.target.value)}
      onBlur={() => changeHeading(localHeading)}
      onFocus={() => {
        if (!isEditing && !isDisabled) {
          setIsEditing(true);
        }
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          changeHeading(localHeading);
          editor?.commands.focus();
        }
      }}
      disabled={isDisabled}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    />
  );

  const renderEditor = () => (
    <StyledEditorBox dynamicFontSize={getFontSize(charCount)}>
      <EditorContent editor={editor} />
    </StyledEditorBox>
  );

  return (
    <Group
      ref={currentRef}
      id={element._id}
      x={element.position.x}
      y={element.position.y}
      width={element.dimensions.width}
      height={element.dimensions.height}
      rotation={element.rotation || 0}
      draggable={!isDisabled && !isEditing}
      onMouseDown={handleSelect}
      onTouchStart={handleTouch}
      onClick={(e) => {
        if (!isEditing) {
          e.cancelBubble = true;
          if (!isSelected) store.dispatch(selectElement(element._id));
        }
      }}
      onTap={(e) => {
        if (!isEditing) {
          e.cancelBubble = true;
          if (!isSelected) store.dispatch(selectElement(element._id));
        }
      }}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      onDragStart={props.onDragStart}
      onDragMove={(e) => {
        if (navigator.onLine) {
          const now = Date.now();
          if (now - lastCursorEmitRef.current >= 100) {
            lastCursorEmitRef.current = now;
            socket.volatile.emit("element:update", {
              boardId: element.boardId || "",
              elementId: element._id,
              payload: {
                ...element,
                position: { x: e.target.x(), y: e.target.y() }
              }
            });
            const stage = e.target.getStage();
            if (stage) {
              const pointer = stage.getPointerPosition();
              const userName = store.getState().auth.user?.name;
              if (pointer && userName) {
                const transform = stage.getAbsoluteTransform().copy().invert();
                const worldPos = transform.point(pointer);
                socket.emit("cursor:move", {
                  boardId: element.boardId || "",
                  x: worldPos.x,
                  y: worldPos.y,
                  name: userName
                });
              }
            }
          }
        }
        if (props.onDragMove) props.onDragMove(e);
      }}
      onDragEnd={props.onDragEnd}
      onTransform={props.onTransform}
      onTransformEnd={props.onTransformEnd}
      onContextMenu={props.onContextMenu}
    >
      <Rect
        width={element.dimensions.width}
        height={element.dimensions.height}
        fill={bgColor}
        stroke={isSelected ? "#3b82f6" : element.style.stroke}
        strokeWidth={isSelected ? 2 : element.style.strokeWidth}
        opacity={element.style.opacity}
        cornerRadius={4}
        shadowColor="rgba(0,0,0,0.15)"
        shadowBlur={12}
        shadowOffsetY={4}
      />

      {!isEditing && renderedImage && (
        <KonvaImage 
          image={renderedImage} 
          width={element.dimensions.width} 
          height={element.dimensions.height} 
          listening={false} 
        />
      )}

      <Html divProps={{ style: { pointerEvents: isEditing ? "auto" : "none", overflow: "visible" } }}>
        <OuterWrapper
          $width={element.dimensions.width}
          $height={element.dimensions.height}
        >
          {renderToolbar()}

          <ContentArea $isEditing={isEditing}>
            {renderHeading()}
            {renderEditor()}
          </ContentArea>
        </OuterWrapper>
      </Html>

      <Group
        x={element.dimensions.width - 32}
        y={4}
        onClick={handleCommentClick}
        onTap={handleCommentClick}
        onMouseEnter={(e) => {
          e.cancelBubble = true;
          setIsBadgeHovered(true);
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "pointer";
        }}
        onMouseLeave={(e) => {
          e.cancelBubble = true;
          setIsBadgeHovered(false);
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "default";
        }}
      >
        <Rect
          width={28}
          height={28}
          cornerRadius={14}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 28, y: 28 }}
          fillLinearGradientColorStops={
            isBadgeHovered
              ? [0, "#4f46e5", 1, "#6366f1"]
              : [0, "#6366f1", 1, "#818cf8"]
          }
          shadowColor="rgba(99,102,241,0.4)"
          shadowBlur={isBadgeHovered ? 12 : 8}
          shadowOffsetY={2}
          scaleX={isBadgeHovered ? 1.05 : 1}
          scaleY={isBadgeHovered ? 1.05 : 1}
          offsetX={isBadgeHovered ? 1.4 : 0}
          offsetY={isBadgeHovered ? 1.4 : 0}
        />
        <Text
          x={isBadgeHovered ? 6 - 1.4 : 6}
          y={isBadgeHovered ? 8 - 1.4 : 8}
          text="💬"
          fontSize={14}
          fill="#fff"
          listening={false}
        />
      </Group>
    </Group>
  );
};
