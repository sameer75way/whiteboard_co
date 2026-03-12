import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Snackbar, Alert } from "@mui/material";
import { AccessManagerModal } from "../Collab/AccessManagerModal";
import { ConflictModal } from "../Sync/ConflictModal";
import { useNavigate } from "react-router-dom";
import type { Board } from "../../../../types/board.types";

interface WhiteboardModalsProps {
  boardId: string;
  isAccessModalOpen: boolean;
  isDeletedDialogOpen: boolean;
  isRemovedDialogOpen: boolean;
  shareSnackbarOpen: boolean;
  onCloseAccess: () => void;
  onCloseShareSnackbar: () => void;
  board: Board | null | undefined;
  isOwner: boolean;
  refetchBoard: () => void;
}

export const WhiteboardModals = ({
  boardId,
  isAccessModalOpen,
  isDeletedDialogOpen,
  isRemovedDialogOpen,
  shareSnackbarOpen,
  onCloseAccess,
  onCloseShareSnackbar,
  board,
  isOwner,
  refetchBoard
}: WhiteboardModalsProps) => {
  const navigate = useNavigate();

  return (
    <>
      <ConflictModal />

      {board && (
        <AccessManagerModal
          open={isAccessModalOpen}
          onClose={onCloseAccess}
          boardId={boardId}
          members={board.members}
          isOwner={isOwner}
          onRoleChanged={refetchBoard}
        />
      )}

      <Dialog open={isDeletedDialogOpen} disableEscapeKeyDown>
        <DialogTitle>Whiteboard Deleted</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The owner has permanently deleted this whiteboard. You will now be redirected to the dashboard.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/dashboard", { replace: true })} color="primary" variant="contained">
            Go to Dashboard
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isRemovedDialogOpen} disableEscapeKeyDown>
        <DialogTitle>Access Revoked</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your access to this whiteboard has been revoked by the owner. You will now be redirected to the dashboard.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/dashboard", { replace: true })} color="primary" variant="contained">
            Go to Dashboard
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={shareSnackbarOpen}
        autoHideDuration={3000}
        onClose={onCloseShareSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          Board share code copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};
