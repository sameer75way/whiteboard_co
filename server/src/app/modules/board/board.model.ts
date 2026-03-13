import mongoose from "mongoose";
import { layerSubSchema, type ILayer } from "../layer/layer.model";

export type BoardRole = "Owner" | "Collaborator" | "Viewer";

interface BoardMember {
  user: mongoose.Types.ObjectId;
  role: BoardRole;
  status: "Pending" | "Accepted";
  joinedAt: Date;
}

export interface IBoard extends mongoose.Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  members: BoardMember[];
  layers: ILayer[];
  shareCode: string;
  isPublic: boolean;
}

const boardMemberSchema = new mongoose.Schema<BoardMember>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  role: {
    type: String,
    enum: ["Owner", "Collaborator", "Viewer"],
    required: true
  },

  status: {
    type: String,
    enum: ["Pending", "Accepted"],
    default: "Accepted"
  },

  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const boardSchema = new mongoose.Schema<IBoard>(
  {
    name: {
      type: String,
      required: true
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    members: [boardMemberSchema],

    layers: {
      type: [layerSubSchema],
      default: []
    },

    shareCode: {
      type: String,
      unique: true,
      index: true
    },

    isPublic: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const BoardModel = mongoose.model<IBoard>("Board", boardSchema);