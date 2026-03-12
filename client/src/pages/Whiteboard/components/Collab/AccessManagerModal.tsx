import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { socket } from '../../../../services/socket/socketClient';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  List, ListItem, ListItemAvatar, ListItemText, Avatar, 
  Select, MenuItem, Typography, IconButton, Box, DialogContentText, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useUpdateRoleMutation, useRemoveMemberMutation } from '../../../../services/api/boardApi';
import type { RootState } from '../../../../store/index';
import type { BoardMember } from '../../../../types/board.types';

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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Manage Board Access</Typography>
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {members.filter(m => m.status === 'Accepted').map((member) => (
            <ListItem 
              key={member._id}
              secondaryAction={
                member.role !== 'Owner' && isOwner && member.user._id !== currentUser?.id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Select
                      size="small"
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.user._id, e.target.value)}
                      disabled={isUpdatingRole || isRemoving}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="Collaborator">Editor</MenuItem>
                      <MenuItem value="Viewer">Viewer</MenuItem>
                    </Select>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => setConfirmRemoveId(member.user._id)}
                      disabled={isUpdatingRole || isRemoving}
                      title="Remove Member"
                    >
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1, px: 2 }}>
                    {member.role === 'Owner' ? 'Owner' : member.role === 'Collaborator' ? 'Editor' : 'Viewer'}
                  </Typography>
                )
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: member.role === 'Owner' ? 'primary.main' : 'secondary.main' }}>
                  {member.user.name.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {member.user.name}
                    {member.user._id === currentUser?.id && (
                      <Typography component="span" variant="caption" color="primary">
                        (You)
                      </Typography>
                    )}
                    <Tooltip title={activeUsers.has(member.user._id) ? "Online" : "Offline"} placement="top">
                      <Box 
                        sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: activeUsers.has(member.user._id) ? '#10b981' : '#6b7280',
                          boxShadow: activeUsers.has(member.user._id) ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
                        }} 
                      />
                    </Tooltip>
                  </Box>
                } 
                secondary={member.user.email} 
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>

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
