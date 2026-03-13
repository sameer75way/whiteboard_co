import { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from "@mui/material";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import SettingsBackupRestoreOutlinedIcon from "@mui/icons-material/SettingsBackupRestoreOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RestoreIcon from "@mui/icons-material/Restore";
import { styled } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import { useRestoreSnapshotMutation } from "../../../../services/api/snapshotApi";
import type { SnapshotListItem } from "../../../../store/snapshot/snapshotSlice";
import type { ApiError } from "../../../../types/api.types";
import { getApiErrorMessage } from "../../../../types/api.types";



interface SnapshotRowProps {
  snapshot: SnapshotListItem;
  boardId: string;
  onPreview: (id: string) => void;
}

const RowContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "16px 16px",
  marginBottom: "8px",
  borderRadius: 12,
  border: "1px solid transparent",
  transition: "all 0.2s ease",
  cursor: "default",
  "&:hover": {
    background: "rgba(99, 102, 241, 0.08)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
  },
  [theme.breakpoints.down("sm")]: {
    gap: 8,
    padding: "12px 8px"
  }
}));

const IconWrapper = styled(Box)<{ snaptype: string }>(({ snaptype }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: 10,
  background: snaptype === "auto" ? "rgba(148, 163, 184, 0.15)" : 
              snaptype === "manual" ? "rgba(99, 102, 241, 0.15)" : 
              "rgba(245, 158, 11, 0.15)",
  color: snaptype === "auto" ? "#94a3b8" : 
         snaptype === "manual" ? "#818cf8" : 
         "#fbbf24",
}));

const InfoSection = styled(Box)({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4
});

const ActionSection = styled(Box)({
  display: "flex",
  gap: 2,
  flexShrink: 0
});

const formatTimestamp = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString();
};

export const SnapshotRow = ({
  snapshot,
  boardId,
  onPreview
}: SnapshotRowProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [restoreApi] = useRestoreSnapshotMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRestore = async () => {
    setConfirmOpen(false);
    try {
      await restoreApi({ boardId, snapshotId: snapshot.id }).unwrap();
      enqueueSnackbar("Board restored successfully", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(getApiErrorMessage(err as ApiError, "Failed to restore board"), { variant: "error" });
    }
  };

  return (
    <>
      <RowContainer>
        <IconWrapper snaptype={snapshot.type}>
          {snapshot.type === "auto" && <CloudOutlinedIcon fontSize="small" />}
          {snapshot.type === "manual" && <EventNoteOutlinedIcon fontSize="small" />}
          {snapshot.type === "restore" && <SettingsBackupRestoreOutlinedIcon fontSize="small" />}
        </IconWrapper>
        <InfoSection>
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.9)"
            fontWeight={500}
            noWrap
            fontSize={14}
          >
            {snapshot.name}
          </Typography>
          <Typography
            variant="caption"
            color="rgba(255,255,255,0.5)"
            fontSize={12}
          >
            {formatTimestamp(snapshot.createdAt)}
          </Typography>
        </InfoSection>
        <ActionSection>
          <IconButton
            size="small"
            onClick={() => onPreview(snapshot.id)}
            title="Preview"
          >
            <VisibilityIcon fontSize="small" htmlColor="rgba(255,255,255,0.6)" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setConfirmOpen(true)}
            title="Restore"
          >
            <RestoreIcon fontSize="small" htmlColor="rgba(255,255,255,0.6)" />
          </IconButton>
        </ActionSection>
      </RowContainer>

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
    </>
  );
};
