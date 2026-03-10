import { Snackbar, Alert, Dialog, DialogTitle, DialogContent, CircularProgress, Typography } from "@mui/material";
import { CreateBoardModal } from "../CreateBoardModal";
import { JoinBoardModal } from "../JoinBoardModal";

interface DashboardModalsProps {
  createOpen: boolean;
  joinOpen: boolean;
  alertInfo: { open: boolean, message: string, severity: 'error' | 'success' };
  waitingApprovalOpen: boolean;
  onCloseCreate: () => void;
  onCloseJoin: () => void;
  onCloseAlert: () => void;
  onCloseWaiting: () => void;
  onCreateBoard: (name: string) => void;
  onJoinBoard: (shareCode: string) => void;
}

export const DashboardModals = ({
  createOpen,
  joinOpen,
  alertInfo,
  waitingApprovalOpen,
  onCloseCreate,
  onCloseJoin,
  onCloseAlert,
  onCloseWaiting,
  onCreateBoard,
  onJoinBoard
}: DashboardModalsProps) => {
  return (
    <>
      <CreateBoardModal
        open={createOpen}
        onClose={onCloseCreate}
        onCreate={onCreateBoard}
      />

      <JoinBoardModal
        open={joinOpen}
        onClose={onCloseJoin}
        onJoin={onJoinBoard}
      />

      <Snackbar 
        open={alertInfo.open} 
        autoHideDuration={6000} 
        onClose={onCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={onCloseAlert} severity={alertInfo.severity} sx={{ width: '100%' }}>
          {alertInfo.message}
        </Alert>
      </Snackbar>

      <Dialog open={waitingApprovalOpen} onClose={onCloseWaiting}>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>Waiting for Approval</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 4, px: 4, minWidth: 300 }}>
          <CircularProgress sx={{ mb: 3 }} />
          <Typography variant="body1" align="center" color="text.secondary">
            The board owner has been notified. 
            <br/>
            Please wait while they review your request...
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};
