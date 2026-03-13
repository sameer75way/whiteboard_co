import { CommentModel, type IComment, type ICommentPopulated } from "./comment.model";
import { AppError } from "../../common/middlewares/errorHandler";
import type { CommentThread } from "./comment.types";

const toPopulated = (doc: IComment): ICommentPopulated => ({
  id: doc._id.toString(),
  boardId: doc.boardId,
  stickyNoteId: doc.stickyNoteId,
  parentCommentId: doc.parentCommentId,
  authorId: doc.authorId,
  authorName: doc.authorName,
  content: doc.content,
  isDeleted: doc.isDeleted,
  createdAt: doc.createdAt,
  replies: []
});

export const createComment = async (
  userId: string,
  elementId: string,
  content: string
): Promise<ICommentPopulated> => {
  const { UserModel } = await import("../auth/auth.model");
  const { ElementModel } = await import("../element/element.model");
  
  const user = await UserModel.findById(userId).select("name").lean();
  if (!user) throw new AppError("User not found", 404);
  
  const element = await ElementModel.findById(elementId).select("boardId").lean();
  if (!element) throw new AppError("Element not found", 404);

  const doc = await CommentModel.create({
    boardId: element.boardId.toString(),
    stickyNoteId: elementId,
    parentCommentId: null,
    authorId: userId,
    authorName: user.name,
    content: content
  });
  return toPopulated(doc);
};

export const createReply = async (
  userId: string,
  elementId: string,
  parentCommentId: string,
  content: string
): Promise<ICommentPopulated> => {
  const { UserModel } = await import("../auth/auth.model");
  const { ElementModel } = await import("../element/element.model");

  const user = await UserModel.findById(userId).select("name").lean();
  if (!user) throw new AppError("User not found", 404);

  const element = await ElementModel.findById(elementId).select("boardId").lean();
  if (!element) throw new AppError("Element not found", 404);

  const parent = await CommentModel.findById(parentCommentId);
  if (!parent || parent.isDeleted) {
    throw new AppError("Parent comment not found", 404);
  }
  if (parent.parentCommentId !== null) {
    throw new AppError("Replies cannot be nested more than one level", 400);
  }
  const doc = await CommentModel.create({
    boardId: element.boardId.toString(),
    stickyNoteId: elementId,
    parentCommentId: parentCommentId,
    authorId: userId,
    authorName: user.name,
    content: content
  });
  return toPopulated(doc);
};

export const getCommentThread = async (
  stickyNoteId: string
): Promise<CommentThread> => {
  const docs = await CommentModel.find({
    stickyNoteId,
    isDeleted: false
  }).sort({ createdAt: 1 });

  const topLevel: ICommentPopulated[] = [];
  const replyMap = new Map<string, ICommentPopulated[]>();

  for (const doc of docs) {
    const populated = toPopulated(doc);
    if (doc.parentCommentId === null) {
      topLevel.push(populated);
    } else {
      const existing = replyMap.get(doc.parentCommentId) ?? [];
      existing.push(populated);
      replyMap.set(doc.parentCommentId, existing);
    }
  }

  for (const comment of topLevel) {
    comment.replies = replyMap.get(comment.id) ?? [];
  }

  return { topLevel };
};

export const softDeleteComment = async (
  commentId: string,
  requestingUserId: string
): Promise<void> => {
  const comment = await CommentModel.findById(commentId);
  if (!comment) {
    throw new AppError("Comment not found", 404);
  }
  if (comment.authorId !== requestingUserId) {
    throw new AppError("You can only delete your own comments", 403);
  }
  comment.isDeleted = true;
  await comment.save();
};

export const cascadeDeleteByStickyNote = async (
  stickyNoteId: string
): Promise<void> => {
  await CommentModel.updateMany(
    { stickyNoteId },
    { isDeleted: true }
  );
};
