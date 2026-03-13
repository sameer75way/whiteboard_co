import { type CanvasElement } from "../../types/element.types";

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
      width: 200,
      height: 200
    },
    rotation: 0,
    style: {
      fill: "#FFF59D",
      stroke: "#FBC02D",
      strokeWidth: 2,
      opacity: 1
    },
    version: 1,
    zIndex: 0,
    layerId
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