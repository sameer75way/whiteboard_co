import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { styled } from "@mui/material/styles";
import {
  Drawer,
  Typography,
  IconButton,
  Box
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { Input } from "../../../../components/ui/Input";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import type { RootState } from "../../../../store/index";
import {
  selectActiveThread,
  selectActiveStickyNoteId,
  selectIsCommentPanelOpen,
  closeCommentPanel,
  setThread,
  appendComment
} from "../../../../store/comments/commentsSlice";
import { useListCommentsQuery, useCreateCommentMutation } from "../../../../services/api/commentApi";
import { socket } from "../../../../services/socket/socketClient";
import { CommentThreadItem } from "./CommentThread";
import { db } from "../../../../services/offline/offlineDB";
import type { CommentPopulated } from "../../../../types/comment.types";

const PanelHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px",
  borderBottom: "1px solid rgba(255,255,255,0.08)"
});

const PanelBody = styled(Box)({
  flex: 1,
  overflowY: "auto",
  padding: "16px"
});

const PanelFooter = styled("form")({
  display: "flex",
  alignItems: "flex-end",
  gap: "8px",
  padding: "12px 16px",
  borderTop: "1px solid rgba(255,255,255,0.08)"
});

const FooterInput = styled(Input)({
  marginTop: 0
});

const EmptyState = styled(Typography)({
  textAlign: "center",
  padding: "40px 16px",
  color: "rgba(255,255,255,0.4)"
});

const StyledDrawer = styled(Drawer)({
  zIndex: 1200,
  "& .MuiDrawer-paper": {
    width: 360,
    maxWidth: "100vw",
    background: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(16px)",
    color: "#e2e8f0",
    top: "72px",
    height: "calc(100% - 72px)",
    borderTopLeftRadius: "8px"
  }
});

const HeaderTitle = styled(Typography)({
  fontWeight: 600,
  color: "#e2e8f0"
});

const HeaderSubtitle = styled(Typography)({
  color: "rgba(255,255,255,0.5)",
  fontSize: "0.75rem",
  maxWidth: 240,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
});

const StyledSendButton = styled(IconButton)({
  color: "#6366f1",
  "&:disabled": {
    color: "rgba(255,255,255,0.2)"
  }
});

export const CommentPanel = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsCommentPanelOpen);
  const activeStickyNoteId = useSelector(selectActiveStickyNoteId);
  const thread = useSelector(selectActiveThread);
  const elements = useSelector((state: RootState) => state.canvas.elements);
  const user = useSelector((state: RootState) => state.auth.user);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: { commentText: "" }
  });
  const commentText = watch("commentText");

  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: threadData } = useListCommentsQuery(activeStickyNoteId ?? "", {
    skip: !activeStickyNoteId
  });

  useEffect(() => {
    if (threadData && activeStickyNoteId) {
      dispatch(setThread({
        stickyNoteId: activeStickyNoteId,
        topLevel: threadData.topLevel
      }));
    }
  }, [threadData, activeStickyNoteId, dispatch]);

  useEffect(() => {
    if (isOpen && activeStickyNoteId) {
      socket.emit("sticky:comments:join", { stickyNoteId: activeStickyNoteId });
    }
  }, [isOpen, activeStickyNoteId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread.length]);

  const handleClose = () => {
    if (activeStickyNoteId) {
      socket.emit("sticky:comments:leave", { stickyNoteId: activeStickyNoteId });
    }
    dispatch(closeCommentPanel());
  };

  const [createComment] = useCreateCommentMutation();

  const onSubmit = async (data: { commentText: string }) => {
    const trimmed = data.commentText.trim();
    if (!trimmed || !activeStickyNoteId) return;
    reset();

    if (navigator.onLine) {
      await createComment({ elementId: activeStickyNoteId, content: trimmed });
    } else {
      const tempId = `temp-${Date.now()}`;
      const fakeComment: CommentPopulated = {
        id: tempId,
        boardId: elements[activeStickyNoteId]?.boardId || "",
        stickyNoteId: activeStickyNoteId,
        content: trimmed,
        authorId: user?.id || "",
        authorName: user?.name || "Offline User",
        createdAt: new Date().toISOString(),
        isDeleted: false,
        parentCommentId: null,
        replies: []
      };
      
      dispatch(appendComment({ stickyNoteId: activeStickyNoteId, comment: fakeComment }));
      
      await db.operations.add({
        boardId: elements[activeStickyNoteId]?.boardId || "",
        elementId: activeStickyNoteId,
        operation: "comment:create",
        payload: { content: trimmed },
        clientVersion: 1
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const getStickySubtitle = (): string => {
    if (!activeStickyNoteId) return "";
    const el = elements[activeStickyNoteId];
    if (!el) return "";
    
    const heading = el.data?.heading as string;
    if (heading) {
      if (heading.length > 40) return heading.substring(0, 40) + "…";
      return heading;
    }

    const content = el.content ?? "";
    if (content.length > 40) return content.substring(0, 40) + "…";
    return content || "Sticky note";
  };

  return (
    <StyledDrawer
      anchor="right"
      open={isOpen}
      onClose={handleClose}
      variant="persistent"
    >
      <PanelHeader>
        <Box>
          <HeaderTitle variant="h6">Comments</HeaderTitle>
          <HeaderSubtitle>{getStickySubtitle()}</HeaderSubtitle>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon htmlColor="rgba(255,255,255,0.7)" />
        </IconButton>
      </PanelHeader>

      <PanelBody ref={scrollRef}>
        {thread.length === 0 && (
          <EmptyState variant="body2">
            No comments yet. Be the first to comment.
          </EmptyState>
        )}
        {thread.map((comment) => (
          <CommentThreadItem
            key={comment.id}
            comment={comment}
            stickyNoteId={activeStickyNoteId ?? ""}
          />
        ))}
      </PanelBody>

      <PanelFooter onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="commentText"
          control={control}
          render={({ field }) => (
            <FooterInput
              {...field}
              fullWidth
              multiline
              maxRows={4}
              size="small"
              placeholder="Add a comment…"
              onKeyDown={handleKeyDown}
            />
          )}
        />
        <StyledSendButton
          type="submit"
          disabled={!commentText.trim()}
          size="small"
        >
          <SendIcon />
        </StyledSendButton>
      </PanelFooter>
    </StyledDrawer>
  );
};
