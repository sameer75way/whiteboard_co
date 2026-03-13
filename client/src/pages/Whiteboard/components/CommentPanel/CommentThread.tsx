import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { styled } from "@mui/material/styles";
import {
  Typography,
  IconButton,
  Box
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { Input } from "../../../../components/ui/Input";
import { TextButton } from "../../../../components/ui/Button";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SendIcon from "@mui/icons-material/Send";
import type { RootState } from "../../../../store/index";
import type { CommentPopulated } from "../../../../types/comment.types";
import { useCreateReplyMutation, useDeleteCommentMutation } from "../../../../services/api/commentApi";
import { db } from "../../../../services/offline/offlineDB";
import { appendReply } from "../../../../store/comments/commentsSlice";

interface Props {
  comment: CommentPopulated;
  stickyNoteId: string;
  isReply?: boolean;
}

const CommentContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isReply"
})<{ isReply?: boolean }>(({ isReply }) => ({
  marginLeft: isReply ? 16 : 0,
  marginBottom: 12,
  padding: "12px",
  borderRadius: "8px",
  background: isReply ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.06)"
}));

const CommentHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 4
});

const AuthorName = styled(Typography)({
  fontWeight: 600,
  color: "#e2e8f0"
});

const Timestamp = styled(Typography)({
  color: "rgba(255,255,255,0.4)"
});

const CommentContent = styled(Typography)({
  color: "rgba(255,255,255,0.8)",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word"
});

const ReplyButton = styled(TextButton)({
  padding: "2px 8px",
  minWidth: "auto",
  fontSize: "0.75rem"
});

const ReplyInputContainer = styled("form")({
  display: "flex",
  alignItems: "flex-end",
  gap: "4px",
  marginTop: 8
});

const ReplyInput = styled(Input)({
  marginTop: 0
});

const StyledDeleteButton = styled(IconButton)({
  color: "rgba(255,255,255,0.3)",
  "&:hover": {
    color: "#ef4444"
  }
});

const StyledReplySendButton = styled(IconButton)({
  color: "#6366f1",
  "&:disabled": {
    color: "rgba(255,255,255,0.2)"
  }
});

const formatTimestamp = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
};

export const CommentThreadItem = ({ comment, stickyNoteId, isReply = false }: Props) => {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const elements = useSelector((state: RootState) => state.canvas.elements);
  const dispatch = useDispatch();
  const [showReplyInput, setShowReplyInput] = useState(false);
  
  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: { replyText: "" }
  });
  const replyText = watch("replyText");

  const [createReply] = useCreateReplyMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const onSubmitReply = async (data: { replyText: string }) => {
    const trimmed = data.replyText.trim();
    if (!trimmed) return;
    reset();
    setShowReplyInput(false);
    
    if (navigator.onLine) {
      await createReply({
        elementId: stickyNoteId,
        commentId: comment.id,
        content: trimmed
      });
    } else {
      const tempId = `temp-${Date.now()}`;
      const boardId = elements[stickyNoteId]?.boardId || "";
      const fakeReply: CommentPopulated = {
        id: tempId,
        boardId,
        stickyNoteId,
        content: trimmed,
        authorId: currentUserId || "",
        authorName: currentUser?.name || "Offline User",
        createdAt: new Date().toISOString(),
        isDeleted: false,
        parentCommentId: comment.id,
        replies: []
      };

      dispatch(appendReply({ stickyNoteId, parentCommentId: comment.id, reply: fakeReply }));

      await db.operations.add({
        boardId,
        elementId: stickyNoteId,
        operation: "comment:reply",
        payload: { content: trimmed, parentCommentId: comment.id },
        clientVersion: 1
      });
    }
  };

  const handleDelete = async () => {
    await deleteComment({
      elementId: stickyNoteId,
      commentId: comment.id
    });
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmitReply)();
    }
  };

  const isOwn = comment.authorId === currentUserId;
  const canReply = !isReply && comment.parentCommentId === null;

  return (
    <>
      <CommentContainer isReply={isReply}>
        <CommentHeader>
          <Box>
            <AuthorName variant="subtitle2">{comment.authorName}</AuthorName>
            <Timestamp variant="caption">{formatTimestamp(comment.createdAt)}</Timestamp>
          </Box>
          {isOwn && (
            <StyledDeleteButton size="small" onClick={handleDelete}>
              <DeleteOutlineIcon fontSize="small" />
            </StyledDeleteButton>
          )}
        </CommentHeader>
        <CommentContent variant="body2">{comment.content}</CommentContent>
        {canReply && (
          <ReplyButton size="small" onClick={() => setShowReplyInput(!showReplyInput)}>
            Reply
          </ReplyButton>
        )}
        {showReplyInput && (
          <ReplyInputContainer onSubmit={handleSubmit(onSubmitReply)}>
            <Controller
              name="replyText"
              control={control}
              render={({ field }) => (
                <ReplyInput
                  {...field}
                  fullWidth
                  size="small"
                  multiline
                  maxRows={3}
                  placeholder="Write a reply…"
                  onKeyDown={handleReplyKeyDown}
                  autoFocus
                />
              )}
            />
            <StyledReplySendButton
              type="submit"
              size="small"
              disabled={!replyText.trim()}
            >
              <SendIcon fontSize="small" />
            </StyledReplySendButton>
          </ReplyInputContainer>
        )}
      </CommentContainer>
      {comment.replies.map((reply) => (
        <CommentThreadItem
          key={reply.id}
          comment={reply}
          stickyNoteId={stickyNoteId}
          isReply
        />
      ))}
    </>
  );
};
