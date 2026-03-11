export type ElementType =
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "text"
  | "pencil"
  | "image"
  | "sticky";

export interface ElementPosition {
  x: number;
  y: number;
}

export interface ElementDimensions {
  width: number;
  height: number;
}

export interface ElementStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface LamportTimestamp {
  clientId: string;
  seq: number;
}

export interface CanvasElement {
  _id: string;

  boardId: string;

  type: ElementType;

  position: ElementPosition;

  dimensions: ElementDimensions;

  rotation: number;

  style: ElementStyle;

  content?: string;

  points?: number[];

  imageUrl?: string;

  version: number;

  /** CRDT logical timestamp — set by the creating/updating client */
  lamportTs?: LamportTimestamp;
}