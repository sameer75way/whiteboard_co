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

const RoleSelectBox = styled(Box)({ minWidth: 160 });

const StyledDialog = styled(Dialog)(({  }) => ({
  '& .MuiPaper-root': {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(24px)',
    backgroundImage: 'none',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    boxShadow: '0 24px 50px -12px rgba(0, 0, 0, 0.5)',
  }
}));

const StyledDialogTitle = styled(DialogTitle)({
  margin: 0,
  padding: '24px 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  '& .MuiTypography-root': {
    fontWeight: 700,
    background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }
});

const StyledDialogContent = styled(DialogContent)({
  padding: '16px 0',
  backgroundColor: 'transparent',
});

const MemberList = styled(List)({
  width: '100%',
  backgroundColor: 'transparent',
  padding: '8px 16px',
});

const StyledListItem = styled(ListItem)({
  borderRadius: '16px',
  margin: '4px 0',
  padding: '12px 16px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  }
});

const FlexBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5)
}));

const RoleText = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(0.5, 1.5),
  borderRadius: '8px',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: theme.palette.text.secondary,
}));

const RoleAvatar = styled(Avatar)<{ userRole: string }>(({ userRole }) => ({
  width: 44,
  height: 44,
  fontSize: '1.1rem',
  fontWeight: 700,
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  background: userRole === 'Owner' 
    ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' 
    : 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
  border: '2px solid rgba(255,255,255,0.1)',
}));

const OnlineIndicator = styled(Box)<{ online?: boolean }>(({ online }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: online ? '#10b981' : '#64748b',
  border: '2px solid rgba(15, 23, 42, 0.8)',
  position: 'relative',
  '&::after': online ? {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: '50%',
    border: '1px solid #10b981',
    animation: 'pulse 2s infinite',
  } : {},
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)', opacity: 1 },
    '100%': { transform: 'scale(2)', opacity: 0 },
  }
}));

const StyledDialogActions = styled(DialogActions)({
  padding: '24px 32px',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
});

const ActionIconButton = styled(IconButton)({
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.2)' }
});

const MemberName = styled(Typography)({
  fontWeight: 600,
  color: '#f8fafc',
});

const YouBadge = styled(Typography)({
  color: '#818cf8',
  fontWeight: 600,
  marginLeft: '-4px',
}) as typeof Typography;

const MemberEmail = styled(Typography)({
  fontSize: '0.75rem',
  color: 'rgba(148, 163, 184, 0.7)',
});

const CloseIconButton = styled(IconButton)({
  color: 'rgba(148, 163, 184, 0.7)',
  '&:hover': { color: '#fff' }
});

const ModalCloseButton = styled(Button)({
  opacity: 0.7,
  '&:hover': { opacity: 1 }
});

const DangerButton = styled(Button)({
  borderRadius: '12px',
});

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
      <StyledListItem 
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
              <ActionIconButton 
                size="small" 
                color="error" 
                onClick={() => setConfirmRemoveId(member.user._id)}
                disabled={isUpdatingRole || isRemoving}
                title="Remove Member"
              >
                <RemoveCircleOutlineIcon fontSize="small" />
              </ActionIconButton>
            </FlexBox>
          ) : (
            <RoleText>
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
              <MemberName variant="body1">
                {member.user.name}
              </MemberName>
              {member.user._id === currentUser?.id && (
                <YouBadge component="span" variant="caption">
                  (You)
                </YouBadge>
              )}
              <Tooltip title={activeUsers.has(member.user._id) ? "Online" : "Offline"} placement="top" arrow>
                <OnlineIndicator online={activeUsers.has(member.user._id)} />
              </Tooltip>
            </FlexBox>
          } 
          secondary={<MemberEmail variant="caption">{member.user.email}</MemberEmail>} 
        />
      </StyledListItem>
    ));
  };

  return (
    <StyledDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <StyledDialogTitle>
        <Typography variant="h6">Manage Board Access</Typography>
        <CloseIconButton 
          onClick={onClose} 
          aria-label="close"
        >
          <CloseIcon />
        </CloseIconButton>
      </StyledDialogTitle>
      
      <StyledDialogContent dividers>
        <MemberList>
          {renderMembers()}
        </MemberList>
      </StyledDialogContent>
      <StyledDialogActions>
        <ModalCloseButton onClick={onClose} color="inherit">
          Close
        </ModalCloseButton>
      </StyledDialogActions>

      <StyledDialog open={!!confirmRemoveId} onClose={() => setConfirmRemoveId(null)}>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <DialogContentText color="text.secondary">
            Are you sure you want to remove this member? They will lose access to the board immediately.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveId(null)} color="inherit">Cancel</Button>
          <DangerButton 
            onClick={handleRemoveMember} 
            color="error" 
            variant="contained" 
            disabled={isRemoving}
          >
            Remove Member
          </DangerButton>
        </DialogActions>
      </StyledDialog>
    </StyledDialog>
  );
};
