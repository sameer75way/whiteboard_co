import { Card } from "../../../components/ui/Card";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/index";
import { useDeleteBoardMutation } from "../../../services/api/boardApi";
import { useState } from "react";

interface Props {
  id: string;
  name: string;
  shareCode?: string;
  members: { user: string | { _id: string }; role: string }[];
}

const CardWrapper = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isDeleting',
})<{ isDeleting?: boolean }>(({ isDeleting }) => ({
  cursor: "pointer",
  height: 130,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: "1.25rem 1.5rem",
  transition: "all 0.3s ease",
  opacity: isDeleting ? 0.5 : 1,
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 12px 24px rgba(0,0,0,0.3)",
  }
}));

const BoardName = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "1.1rem",
  color: theme.palette.text.primary
}));

const ShareContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  marginTop: "auto"
});

const ShareText = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: theme.palette.text.secondary,
  fontFamily: "monospace"
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  padding: "2px"
}));

const CopyIcon = styled(ContentCopyIcon)({
  fontSize: 14
});

const CardHeader = styled(Box)({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
});

const RoleBadgeContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1)
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.error.main,
  opacity: 0,
  transition: 'opacity 0.2s',
  '.MuiCard-root:hover &': { opacity: 1 }
}));

const RoleBadge = styled(Box)<{ role: string }>(({ role }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.5px',
  backgroundColor: role === 'Owner' 
    ? 'rgba(56, 189, 248, 0.15)' 
    : role === 'Collaborator' 
      ? 'rgba(52, 211, 153, 0.15)' 
      : 'rgba(148, 163, 184, 0.15)',
  color: role === 'Owner' 
    ? '#38bdf8' 
    : role === 'Collaborator' 
      ? '#34d399' 
      : '#94a3b8',
  border: `1px solid ${
    role === 'Owner' 
      ? 'rgba(56, 189, 248, 0.3)' 
      : role === 'Collaborator' 
        ? 'rgba(52, 211, 153, 0.3)' 
        : 'rgba(148, 163, 184, 0.3)'
  }`
}));

export const BoardCard = ({ id, name, shareCode, members }: Props) => {

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [deleteBoard, { isLoading: isDeleting }] = useDeleteBoardMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const currentMember = members?.find(
    (member) => member.user === currentUser?.id || (typeof member.user === 'object' && member.user?._id === currentUser?.id)
  );
  const role = currentMember?.role || 'Viewer';
  const roleLabel = role === 'Collaborator' ? 'Editor' : role;

  const navigate = useNavigate();

  const openBoard = () => {
    navigate(`/board/${id}`);
  };

  const copyShareCode = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (shareCode) {
      navigator.clipboard.writeText(shareCode);
    }
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await deleteBoard(id).unwrap();
      setDeleteDialogOpen(false);
    } catch {
      return;
    }
  };

  const handleCancelDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteDialogOpen(false);
  };

  return (
    <CardWrapper onClick={openBoard} isDeleting={isDeleting}>
      <CardHeader>
        <Box>
          <BoardName>
            {name}
          </BoardName>
          <RoleBadgeContainer>
            <RoleBadge role={role}>
              {roleLabel.toUpperCase()}
            </RoleBadge>
          </RoleBadgeContainer>
        </Box>
        {role === 'Owner' && (
          <Tooltip title="Delete Board" placement="top">
            <DeleteButton 
              size="small" 
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              <DeleteIcon fontSize="small" />
            </DeleteButton>
          </Tooltip>
        )}
      </CardHeader>
      {role === 'Owner' && shareCode && (
        <ShareContainer>
          <ShareText>
            Code: {shareCode}
          </ShareText>
          <Tooltip title="Copy share code" placement="top" arrow>
            <CopyButton size="small" onClick={copyShareCode}>
              <CopyIcon />
            </CopyButton>
          </Tooltip>
        </ShareContainer>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Delete "{name}"?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete this whiteboard? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </CardWrapper>
  );
};