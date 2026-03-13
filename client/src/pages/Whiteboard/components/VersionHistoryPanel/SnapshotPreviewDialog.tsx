import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestoreIcon from "@mui/icons-material/Restore";
import { styled } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import type { RootState } from "../../../../store/index";
import {
  setPreviewOpen,
  setPreviewSnapshot
} from "../../../../store/snapshot/snapshotSlice";
import { useGetSnapshotQuery, useRestoreSnapshotMutation, useDeleteSnapshotMutation } from "../../../../services/api/snapshotApi";
import { useGetBoardQuery } from "../../../../services/api/boardApi";
import { CanvasBoard } from "../Canvas/CanvasBoard";
import DeleteIcon from "@mui/icons-material/Delete";

interface BoardMember {
  user: string | { _id: string };
  role: string;
  status: string;
}

interface ApiError {
  data?: { message?: string };
}

const PreviewBanner = styled(Chip)(({ theme }) => ({
  position: "absolute",
  top: 72,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 10,
  pointerEvents: "none",
  [theme.breakpoints.down("sm")]: {
    top: 64,
    maxWidth: "90%"
  }
}));

const TitleContainer = styled(Box)({
  flex: 1,
  marginLeft: 16,
  display: "flex",
  alignItems: "center",
  overflow: "hidden"
});

const TitleText = styled(Typography)({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
});

const TimestampText = styled(Typography)(({ theme }) => ({
  marginLeft: 16,
  color: theme.palette.text.secondary,
  whiteSpace: "nowrap",
  [theme.breakpoints.down("md")]: {
    display: "none"
  }
}));

const ActionButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: 16,
  marginLeft: 8,
  [theme.breakpoints.down("sm")]: {
    gap: 8,
    marginLeft: 4
  }
}));

const LoadingContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  width: "100%"
});

const formatTimestamp = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString();
};

export const SnapshotPreviewDialog = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.snapshot.isPreviewOpen);
  const preview = useSelector((state: RootState) => state.snapshot.previewSnapshot);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { enqueueSnackbar } = useSnackbar();
  
  const [restoreApi] = useRestoreSnapshotMutation();
  const [deleteApi] = useDeleteSnapshotMutation();
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: boardData } = useGetBoardQuery(preview?.boardId ?? "", { skip: !preview?.boardId });
  const isOwner = boardData?.data?.members?.find((m: BoardMember) => 
    (typeof m.user === 'object' ? m.user?._id : m.user) === currentUser?.id
  )?.role === "Owner";

  const { data, isLoading } = useGetSnapshotQuery(
    { boardId: preview?.boardId ?? "", snapshotId: preview?.id ?? "" },
    { skip: !isOpen || !preview }
  );

  const handleClose = () => {
    dispatch(setPreviewOpen(false));
    dispatch(setPreviewSnapshot(null));
  };

  const handleRestore = async () => {
    if (!preview) return;
    setConfirmOpen(false);
    try {
      await restoreApi({ boardId: preview.boardId, snapshotId: preview.id }).unwrap();
      enqueueSnackbar("Board restored successfully", { variant: "success" });
      handleClose();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      enqueueSnackbar(apiErr?.data?.message || "Failed to restore board", { variant: "error" });
    }
  };

  const handleDelete = async () => {
    if (!preview) return;
    setDeleteConfirmOpen(false);
    try {
      await deleteApi({ boardId: preview.boardId, snapshotId: preview.id }).unwrap();
      enqueueSnackbar("Snapshot deleted.", { variant: "success" });
      handleClose();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      enqueueSnackbar(apiErr?.data?.message || "Failed to delete snapshot", { variant: "error" });
    }
  };

  const renderBody = () => {
    if (isLoading || !data) {
      return (
        <LoadingContainer>
          <CircularProgress size={48} />
        </LoadingContainer>
      );
    }

    return (
      <Box position="relative" width="100%" height="100%">
        <PreviewBanner
          label="Read-only preview — this is not the live board"
          color="warning"
          variant="outlined"
        />
        <CanvasBoard
          boardId={data.boardId}
          readOnly={true}
          previewElements={data.state.elements}
          previewLayers={data.state.layers}
        />
      </Box>
    );
  };

  return (
    <>
      <Dialog fullScreen open={isOpen} onClose={handleClose}>
        <AppBar position="relative" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
            <TitleContainer>
              <TitleText variant="h6">
                {preview?.name ?? "Snapshot Preview"}
              </TitleText>
              {preview && (
                <TimestampText variant="caption">
                  {formatTimestamp(preview.createdAt)}
                </TimestampText>
              )}
            </TitleContainer>
            <ActionButtonsContainer>
              {isOwner && (
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  Delete
                </Button>
              )}
              <Button
                color="warning"
                variant="contained"
                startIcon={<RestoreIcon />}
                onClick={() => setConfirmOpen(true)}
              >
                Restore
              </Button>
            </ActionButtonsContainer>
          </Toolbar>
        </AppBar>
        <Box flex={1} overflow="hidden" bgcolor="#0f172a">
          {renderBody()}
        </Box>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Restore Version</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will replace the current board state for all collaborators.
            This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleRestore} color="warning" variant="contained">
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Version</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete this snapshot? It will be removed from the history for all collaborators.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
