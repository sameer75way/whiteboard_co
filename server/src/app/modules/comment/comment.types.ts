import type { ICommentPopulated } from "./comment.model";

export interface CreateCommentInput {
  boardId: string;
  stickyNoteId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentCommentId: null;
}

export interface CreateReplyInput {
  boardId: string;
  stickyNoteId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentCommentId: string;
}

export interface CommentThread {
  topLevel: ICommentPopulated[];
}
