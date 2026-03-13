import { Snackbar, Alert, Dialog, DialogTitle, DialogContent, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { CreateBoardModal } from "../CreateBoardModal";
import { JoinBoardModal } from "../JoinBoardModal";

const FullWidthAlert = styled(Alert)({
  width: '100%'
});

const CenteredTitle = styled(DialogTitle)(({ theme }) => ({
  textAlign: 'center',
  paddingTop: theme.spacing(4)
}));

const CenteredContent = styled(DialogContent)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingBottom: theme.spacing(4),
  paddingLeft: theme.spacing(4),
  paddingRight: theme.spacing(4),
  minWidth: 300
}));

const SpacedProgress = styled(CircularProgress)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}));

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
        <FullWidthAlert onClose={onCloseAlert} severity={alertInfo.severity}>
          {alertInfo.message}
        </FullWidthAlert>
      </Snackbar>

      <Dialog open={waitingApprovalOpen} onClose={onCloseWaiting}>
        <CenteredTitle>Waiting for Approval</CenteredTitle>
        <CenteredContent>
          <SpacedProgress />
          <Typography variant="body1" align="center" color="text.secondary">
            The board owner has been notified. 
            <br/>
            Please wait while they review your request...
          </Typography>
        </CenteredContent>
      </Dialog>
    </>
  );
};
