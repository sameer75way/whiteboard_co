import mongoose from "mongoose";

interface IRefreshToken extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
}

const refreshTokenSchema = new mongoose.Schema<IRefreshToken>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    token: {
      type: String,
      required: true,
      index: true
    },

    expiresAt: {
      type: Date,
      required: true
    },

    isRevoked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const RefreshTokenModel = mongoose.model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema
);