import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { socket } from '../../../../services/socket/socketClient';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  List, ListItem, ListItemAvatar, ListItemText, Avatar, 
  Typography, IconButton, Box, DialogContentText, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useUpdateRoleMutation, useRemoveMemberMutation } from '../../../../services/api/boardApi';
import type { RootState } from '../../../../store/index';
import type { BoardMember } from '../../../../types/board.types';
import { useForm } from 'react-hook-form';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { styled } from '@mui/material/styles';

const RoleSelectBox = styled(Box)({ minWidth: 140 });

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const StyledDialogContent = styled(DialogContent)({ padding: 0 });

const MemberList = styled(List)(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.background.paper
}));

const FlexBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const RoleText = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1, 2)
}));

const RoleAvatar = styled(Avatar)<{ userRole: string }>(({ theme, userRole }) => ({
  backgroundColor: userRole === 'Owner' ? theme.palette.primary.main : theme.palette.secondary.main
}));

const OnlineIndicator = styled(Box)<{ online?: boolean }>(({ online }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: online ? '#10b981' : '#6b7280',
  boxShadow: online ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2)
}));
const RoleSelectWrapper = ({ 
  member, 
  isUpdatingRole, 
  isRemoving, 
  handleRoleChange 
}: { 
  member: BoardMember; 
  isUpdatingRole: boolean; 
  isRemoving: boolean; 
  handleRoleChange: (userId: string, role: string) => void;
}) => {
  const { control } = useForm({ defaultValues: { role: member.role } });

  return (
    <RoleSelectBox>
      <FormSelect
        name="role"
        control={control}
        options={[
          { value: "Collaborator", label: "Editor" },
          { value: "Viewer", label: "Viewer" }
        ]}
        isDisabled={isUpdatingRole || isRemoving}
        onChangeCallback={(val) => val && handleRoleChange(member.user._id, val)}
      />
    </RoleSelectBox>
  );
};

interface AccessManagerModalProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  members: BoardMember[];
  isOwner: boolean;
  onRoleChanged: () => void;
}

export const AccessManagerModal = ({ open, onClose, boardId, members, isOwner, onRoleChanged }: AccessManagerModalProps) => {
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;

    const handlePresence = (userIds: string[]) => {
      setActiveUsers(new Set(userIds));
    };

    socket.on("board:presence", handlePresence);
    socket.emit("board:request_presence", { boardId });

    return () => {
      socket.off("board:presence", handlePresence);
    };
  }, [open, boardId]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRole({ boardId, userId, role: newRole }).unwrap();
      onRoleChanged();
    } catch {
      return;
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmRemoveId) return;
    try {
      await removeMember({ boardId, userId: confirmRemoveId }).unwrap();
      onRoleChanged();
    } catch {
      return;
    } finally {
      setConfirmRemoveId(null);
    }
  };

  const renderMembers = () => {
    return members.filter(m => m.status === 'Accepted').map((member) => (
      <ListItem 
        key={member._id}
        secondaryAction={
          member.role !== 'Owner' && isOwner && member.user._id !== currentUser?.id ? (
            <FlexBox>
              <RoleSelectWrapper
                member={member}
                isUpdatingRole={isUpdatingRole}
                isRemoving={isRemoving}
                handleRoleChange={handleRoleChange}
              />
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => setConfirmRemoveId(member.user._id)}
                disabled={isUpdatingRole || isRemoving}
                title="Remove Member"
              >
                <RemoveCircleOutlineIcon fontSize="small" />
              </IconButton>
            </FlexBox>
          ) : (
            <RoleText variant="body2" color="text.secondary">
              {member.role === 'Owner' ? 'Owner' : member.role === 'Collaborator' ? 'Editor' : 'Viewer'}
            </RoleText>
          )
        }
      >
        <ListItemAvatar>
          <RoleAvatar userRole={member.role}>
            {member.user.name.charAt(0).toUpperCase()}
          </RoleAvatar>
        </ListItemAvatar>
        <ListItemText 
          primary={
            <FlexBox>
              {member.user.name}
              {member.user._id === currentUser?.id && (
                <Typography component="span" variant="caption" color="primary">
                  (You)
                </Typography>
              )}
              <Tooltip title={activeUsers.has(member.user._id) ? "Online" : "Offline"} placement="top">
                <OnlineIndicator online={activeUsers.has(member.user._id)} />
              </Tooltip>
            </FlexBox>
          } 
          secondary={member.user.email} 
        />
      </ListItem>
    ));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <StyledDialogTitle>
        <Typography variant="h6">Manage Board Access</Typography>
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      
      <StyledDialogContent dividers>
        <MemberList>
          {renderMembers()}
        </MemberList>
      </StyledDialogContent>
      <StyledDialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </StyledDialogActions>

      <Dialog open={!!confirmRemoveId} onClose={() => setConfirmRemoveId(null)}>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this member? They will lose access to the board immediately.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveId(null)}>Cancel</Button>
          <Button onClick={handleRemoveMember} color="error" variant="contained" disabled={isRemoving}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
