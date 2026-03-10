import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role: "Admin" | "User";
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    password: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    avatar: {
      type: String
    },

    role: {
      type: String,
      enum: ["Admin", "User"],
      default: "User"
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);