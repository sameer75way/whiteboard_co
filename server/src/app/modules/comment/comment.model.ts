import mongoose from "mongoose";

export interface IComment {
  _id: mongoose.Types.ObjectId;
  boardId: string;
  stickyNoteId: string;
  parentCommentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
}

export interface ICommentPopulated {
  id: string;
  boardId: string;
  stickyNoteId: string;
  parentCommentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  replies: ICommentPopulated[];
}

const commentSchema = new mongoose.Schema<IComment>(
  {
    boardId: {
      type: String,
      required: true
    },
    stickyNoteId: {
      type: String,
      required: true
    },
    parentCommentId: {
      type: String,
      default: null
    },
    authorId: {
      type: String,
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

commentSchema.index({ stickyNoteId: 1, createdAt: 1 });
commentSchema.index({ boardId: 1 });

export const CommentModel = mongoose.model<IComment>("Comment", commentSchema);
