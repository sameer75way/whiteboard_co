import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CommentPopulated } from "../../types/comment.types";
import type { RootState } from "../index";

interface CommentsState {
  threadsByStickyId: Record<string, CommentPopulated[]>;
  activeStickyNoteId: string | null;
  isCommentPanelOpen: boolean;
}

const initialState: CommentsState = {
  threadsByStickyId: {},
  activeStickyNoteId: null,
  isCommentPanelOpen: false
};

const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    setThread(
      state,
      action: PayloadAction<{ stickyNoteId: string; topLevel: CommentPopulated[] }>
    ) {
      state.threadsByStickyId[action.payload.stickyNoteId] = action.payload.topLevel;
    },

    appendComment(
      state,
      action: PayloadAction<{ stickyNoteId: string; comment: CommentPopulated }>
    ) {
      const { stickyNoteId, comment } = action.payload;
      const thread = state.threadsByStickyId[stickyNoteId];
      if (thread) {
        const exists = thread.some((c) => c.id === comment.id);
        if (!exists) {
          thread.push(comment);
        }
      } else {
        state.threadsByStickyId[stickyNoteId] = [comment];
      }
    },

    appendReply(
      state,
      action: PayloadAction<{
        stickyNoteId: string;
        parentCommentId: string;
        reply: CommentPopulated;
      }>
    ) {
      const { stickyNoteId, parentCommentId, reply } = action.payload;
      const thread = state.threadsByStickyId[stickyNoteId];
      if (!thread) return;
      const parent = thread.find((c) => c.id === parentCommentId);
      if (!parent) return;
      const exists = parent.replies.some((r) => r.id === reply.id);
      if (!exists) {
        parent.replies.push(reply);
      }
    },

    removeComment(
      state,
      action: PayloadAction<{ stickyNoteId: string; commentId: string }>
    ) {
      const { stickyNoteId, commentId } = action.payload;
      const thread = state.threadsByStickyId[stickyNoteId];
      if (!thread) return;

      const topIdx = thread.findIndex((c) => c.id === commentId);
      if (topIdx !== -1) {
        thread.splice(topIdx, 1);
        return;
      }

      for (const comment of thread) {
        const replyIdx = comment.replies.findIndex((r) => r.id === commentId);
        if (replyIdx !== -1) {
          comment.replies.splice(replyIdx, 1);
          return;
        }
      }
    },

    setActiveStickyNote(state, action: PayloadAction<string | null>) {
      state.activeStickyNoteId = action.payload;
      state.isCommentPanelOpen = action.payload !== null;
    },

    closeCommentPanel(state) {
      state.isCommentPanelOpen = false;
      state.activeStickyNoteId = null;
    }
  }
});

export const {
  setThread,
  appendComment,
  appendReply,
  removeComment,
  setActiveStickyNote,
  closeCommentPanel
} = commentsSlice.actions;

export const selectActiveThread = (state: RootState) => {
  const id = state.comments.activeStickyNoteId;
  if (!id) return [];
  return state.comments.threadsByStickyId[id] ?? [];
};

export const selectActiveStickyNoteId = (state: RootState) =>
  state.comments.activeStickyNoteId;

export const selectIsCommentPanelOpen = (state: RootState) =>
  state.comments.isCommentPanelOpen;

export default commentsSlice.reducer;
