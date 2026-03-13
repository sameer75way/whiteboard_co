export interface Comment {
  id: string;
  boardId: string;
  stickyNoteId: string;
  parentCommentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
}

export interface CommentPopulated extends Comment {
  replies: CommentPopulated[];
}

export interface CommentThread {
  topLevel: CommentPopulated[];
}
