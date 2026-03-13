import mongoose from "mongoose";

export interface ILayer {
  id: string;
  name: string;
  order: number;
  isVisible: boolean;
  isLocked: boolean;
}

export const layerSubSchema = new mongoose.Schema<ILayer>(
  {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    isLocked: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);
