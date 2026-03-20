import { type CanvasElement } from "../../types/element.types";

export interface StickerPreset {
  symbol: string;
  fill: string;
  stroke: string;
}

export const generateId = (): string => {
  return crypto.randomUUID();
};

export const createRectangleElement = (
  boardId: string,
  x: number,
  y: number,
  layerId?: string
): CanvasElement => {
  return {
    _id: generateId(),
    boardId,
    type: "rectangle",
    position: { x, y },
    dimensions: {
      width: 200,
      height: 150
    },
    rotation: 0,
    style: {
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 2,
      opacity: 1
    },
    version: 1,
    zIndex: 0,
    layerId
  };
};

export const createTextElement = (
  boardId: string,
  x: number,
  y: number,
  layerId?: string
): CanvasElement => {
  return {
    _id: generateId(),
    boardId,
    type: "text",
    position: { x, y },
    dimensions: {
      width: 200,
      height: 50
    },
    rotation: 0,
    style: {
      fill: "#000000",
      stroke: "",
      strokeWidth: 0,
      opacity: 1
    },
    version: 1,
    zIndex: 0,
    layerId
  };
};

export const createStickyNote = (
  boardId: string,
  x: number,
  y: number,
  layerId?: string
): CanvasElement => {
  return {
    _id: generateId(),
    boardId,
    type: "sticky",
    position: { x, y },
    dimensions: {
      width: 240,
      height: 200
    },
    rotation: 0,
    style: {
      fill: "#FFF9C4",
      stroke: "#FBC02D",
      strokeWidth: 2,
      opacity: 1
    },
    version: 1,
    zIndex: 0,
    layerId,
    data: {
      backgroundColor: "#FFF9C4",
      richContent: { type: "doc", content: [{ type: "paragraph" }] }
    }
  };
};

export const createCircleElement = (
  boardId: string,
  x: number,
  y: number,
  layerId?: string
): CanvasElement => {
  return {
    _id: generateId(),
    boardId,
    type: "circle",
    position: { x, y },
    dimensions: {
      width: 150,
      height: 150
    },
    rotation: 0,
    style: {
      fill: "#c7d2fe",
      stroke: "#6366f1",
      strokeWidth: 2,
      opacity: 1
    },
    version: 1,
    zIndex: 0,
    layerId
  };
};

export const createTriangleElement = (
  boardId: string,
  x: number,
  y: number,
  layerId?: string
): CanvasElement => {
  return {
    _id: generateId(),
    boardId,
    type: "triangle",
    position: { x, y },
    dimensions: {
      width: 150,
      height: 150
    },
    rotation: 0,
    style: {
      fill: "#fef08a",
      stroke: "#eab308",
      strokeWidth: 2,
      opacity: 1
    },
    version: 1,
    zIndex: 0,
    layerId
  };
};

export const createLineElement = (
  boardId: string,
  x: number,
  y: number,
  layerId?: string
): CanvasElement => {
  return {
    _id: generateId(),
    boardId,
    type: "line",
    position: { x, y },
    dimensions: {
      width: 200,
      height: 20
    },
    points: [0, 0, 200, 0],
    rotation: 0,
    style: {
      fill: "transparent",
      stroke: "#cbd5e1",
      strokeWidth: 4,
      opacity: 1
    },
    version: 1,
    zIndex: 0,
    layerId
  };
};

export const createStickerElement = (
  boardId: string,
  x: number,
  y: number,
  layerId?: string,
  preset?: StickerPreset
): CanvasElement => {
  const stickerPreset: StickerPreset = preset ?? {
    symbol: "⭐",
    fill: "#fef3c7",
    stroke: "#f59e0b"
  };

  return {
    _id: generateId(),
    boardId,
    type: "sticker",
    position: { x, y },
    dimensions: {
      width: 160,
      height: 160
    },
    rotation: 0,
    style: {
      fill: stickerPreset.fill,
      stroke: stickerPreset.stroke,
      strokeWidth: 2,
      opacity: 1,
      fontSize: 64
    },
    content: stickerPreset.symbol,
    version: 1,
    zIndex: 0,
    layerId
  };
};

export const createEmojiElement = (
  boardId: string,
  x: number,
  y: number,
  layerId?: string,
  emoji?: string
): CanvasElement => {
  return {
    _id: generateId(),
    boardId,
    type: "emoji",
    position: { x, y },
    dimensions: {
      width: 96,
      height: 96
    },
    rotation: 0,
    style: {
      fill: "#f8fafc",
      stroke: "transparent",
      strokeWidth: 0,
      opacity: 1,
      fontSize: 64
    },
    content: emoji ?? "😀",
    version: 1,
    zIndex: 0,
    layerId
  };
};

export const createGifElement = (
  boardId: string,
  x: number,
  y: number,
  gifUrl: string,
  layerId?: string
): CanvasElement => {
  return {
    _id: generateId(),
    boardId,
    type: "image",
    position: { x, y },
    dimensions: {
      width: 220,
      height: 180
    },
    rotation: 0,
    style: {
      fill: "transparent",
      stroke: "#94a3b8",
      strokeWidth: 0,
      opacity: 1
    },
    imageUrl: gifUrl,
    version: 1,
    zIndex: 0,
    layerId,
    data: {
      source: "giphy"
    }
  };
};