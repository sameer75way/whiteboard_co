import mongoose from "mongoose";
import type { CanvasElement } from "../../common/types/element.types";
import type { ILayer } from "../layer/layer.model";
import type { IComment } from "../comment/comment.model";

export interface ISnapshot extends mongoose.Document {
  boardId: string;
  type: "auto" | "manual" | "restore";
  name: string;
  state: {
    elements: CanvasElement[];
    layers: ILayer[];
    comments: IComment[];
  };
  createdBy: string;
  createdAt: Date;
}

const snapshotSchema = new mongoose.Schema<ISnapshot>(
  {
    boardId: {
      type: String,
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["auto", "manual", "restore"],
      required: true
    },

    name: {
      type: String,
      required: true
    },

    state: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "boardsnapshots"
  }
);

snapshotSchema.index({ boardId: 1, createdAt: -1 });

export const SnapshotModel = mongoose.model<ISnapshot>("BoardSnapshot", snapshotSchema);
