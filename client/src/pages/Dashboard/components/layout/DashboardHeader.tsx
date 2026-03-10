import { Typography, Box } from "@mui/material";
import { styled } from '@mui/material/styles';

const HeaderContainer = styled(Box)({
  marginBottom: "48px",
  textAlign: "center"
});

const WorkspaceTitle = styled(Typography)({
  fontWeight: 800,
  display: 'inline-block',
  background: 'linear-gradient(to right, #e0e7ff, #818cf8)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: "-0.5px"
});

const WorkspaceSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  maxWidth: 600,
  margin: '0 auto',
  fontSize: '1.1rem'
}));

const AdminBadge = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(239, 68, 68, 0.15)',
  color: '#f87171',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '20px',
  padding: '4px 14px',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: '8px'
});

interface DashboardHeaderProps {
  isAdmin: boolean;
}

export const DashboardHeader = ({ isAdmin }: DashboardHeaderProps) => {
  return (
    <HeaderContainer>
      <WorkspaceTitle variant="h4" gutterBottom>
        {isAdmin ? "Admin Workspace" : "Your Workspace"}
      </WorkspaceTitle>
      {isAdmin && (
        <AdminBadge>
          &#9670; Admin Mode — Viewing All Boards
        </AdminBadge>
      )}
      <WorkspaceSubtitle variant="body1">
        {isAdmin
          ? "You have admin access. All boards from all users are visible."
          : "Create, collaborate, and bring your ideas to life on an infinite canvas."
        }
      </WorkspaceSubtitle>
    </HeaderContainer>
  );
};
