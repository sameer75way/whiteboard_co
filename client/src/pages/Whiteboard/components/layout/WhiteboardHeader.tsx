import { Box, Button, Tooltip } from "@mui/material";
import PeopleIcon from '@mui/icons-material/People';
import ShareIcon from '@mui/icons-material/Share';

interface WhiteboardHeaderProps {
  isOwner: boolean;
  onShareCode: () => void;
  onManageAccess: () => void;
}

export const WhiteboardHeader = ({ isOwner, onShareCode, onManageAccess }: WhiteboardHeaderProps) => {
  if (!isOwner) return null;

  return (
    <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', gap: 2 }}>
      <Tooltip title="Copy Share Code">
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<ShareIcon />}
          onClick={onShareCode}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, backdropFilter: 'blur(8px)', background: 'rgba(99, 102, 241, 0.8)' }}
        >
          Share Code
        </Button>
      </Tooltip>
      
      <Button 
        variant="contained" 
        color="secondary" 
        startIcon={<PeopleIcon />}
        onClick={onManageAccess}
        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, backdropFilter: 'blur(8px)', background: 'rgba(139, 92, 246, 0.8)' }}
      >
        Manage Access
      </Button>
    </Box>
  );
};
