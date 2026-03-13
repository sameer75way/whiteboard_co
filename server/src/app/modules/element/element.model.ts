import mongoose from "mongoose";
import { ElementType, LamportTimestamp } from "../../common/types/element.types";
export { ElementType, LamportTimestamp };

interface Position {
  x: number;
  y: number;
}

interface Dimensions {
  width: number;
  height: number;
}

interface Style {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  fontSize?: number;
}

export interface IElement {
  _id: string;
  boardId: mongoose.Types.ObjectId;
  type: ElementType;
  position: Position;
  dimensions: Dimensions;
  rotation: number;
  style: Style;
  content?: string;
  points?: number[];
  imageUrl?: string;
  version: number;
  lamportTs?: LamportTimestamp;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  zIndex: number;
  layerId?: string;
  data?: Record<string, unknown>;
}

const elementSchema = new mongoose.Schema<IElement>(
  {
    _id: {
      type: String,
      required: true
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      index: true
    },

    type: {
      type: String,
      enum: [
        "rectangle",
        "circle",
        "line",
        "arrow",
        "text",
        "pencil",
        "image",
        "sticky",
        "triangle",
        "line"
      ],
      required: true
    },

    position: {
      x: Number,
      y: Number
    },

    dimensions: {
      width: Number,
      height: Number
    },

    rotation: {
      type: Number,
      default: 0
    },

    style: {
      fill: String,
      stroke: String,
      strokeWidth: Number,
      opacity: Number,
      fontSize: Number
    },

    content: String,

    points: [Number],

    imageUrl: String,

    version: {
      type: Number,
      default: 1
    },

    lamportTs: {
      clientId: { type: String },
      seq: { type: Number }
    },
    zIndex: {
      type: Number,
      default: 0
    },

    layerId: {
      type: String,
      default: ""
    },

    data: {
      type: mongoose.Schema.Types.Mixed
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

export const ElementModel = mongoose.model<IElement>(
  "Element",
  elementSchema
);