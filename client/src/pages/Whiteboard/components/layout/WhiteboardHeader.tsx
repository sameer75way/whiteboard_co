import { Box, Button, Tooltip } from "@mui/material";
import PeopleIcon from '@mui/icons-material/People';
import ShareIcon from '@mui/icons-material/Share';
import { styled } from '@mui/material/styles';

const HeaderContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  zIndex: 1000,
  display: 'flex',
  gap: theme.spacing(2)
}));

const ShareButton = styled(Button)({
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  backdropFilter: 'blur(8px)',
  background: 'rgba(99, 102, 241, 0.8)'
});

const ManageAccessButton = styled(Button)({
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  backdropFilter: 'blur(8px)',
  background: 'rgba(139, 92, 246, 0.8)'
});

interface WhiteboardHeaderProps {
  isOwner: boolean;
  onShareCode: () => void;
  onManageAccess: () => void;
}

export const WhiteboardHeader = ({ isOwner, onShareCode, onManageAccess }: WhiteboardHeaderProps) => {
  if (!isOwner) return null;

  return (
    <HeaderContainer>
      <Tooltip title="Copy Share Code">
        <ShareButton 
          variant="contained" 
          color="primary" 
          startIcon={<ShareIcon />}
          onClick={onShareCode}
        >
          Share Code
        </ShareButton>
      </Tooltip>
      
      <ManageAccessButton 
        variant="contained" 
        color="secondary" 
        startIcon={<PeopleIcon />}
        onClick={onManageAccess}
      >
        Manage Access
      </ManageAccessButton>
    </HeaderContainer>
  );
};
