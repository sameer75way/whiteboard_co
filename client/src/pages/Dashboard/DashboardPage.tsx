import { Box } from "@mui/material";
import { Add as AddIcon, GroupAdd as JoinIcon } from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

import { BoardGrid } from "./components/BoardGrid";
import { DashboardActionCard } from "./components/DashboardActionCard";
import { DashboardHeader } from "./components/layout/DashboardHeader";
import { DashboardModals } from "./components/layout/DashboardModals";
import { useDashboardLogic } from "./hooks/useDashboardLogic";

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const PageContainer = styled('div')(() => ({
  minHeight: '100vh',
  background: `linear-gradient(-45deg, #0f172a, #1e1b4b, #312e81, #0f172a)`,
  backgroundSize: '400% 400%',
  animation: `${gradientAnimation} 15s ease infinite`,
  padding: '4rem 2rem',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'radial-gradient(circle at top center, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  }
}));

const ContentWrapper = styled(Box)({
  maxWidth: 1000,
  margin: "0 auto",
  position: 'relative',
  zIndex: 1,
});

const ActionsContainer = styled(Box)({
  display: 'flex',
  gap: '24px',
  marginBottom: '48px',
  flexWrap: 'wrap'
});

const RecentBoardsHeader = styled('div')(({ theme }) => ({
  marginBottom: '24px',
  fontWeight: 700,
  color: theme.palette.text.primary,
  fontSize: '1.25rem',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}));

const Badge = styled('span')({
  background: 'rgba(99, 102, 241, 0.2)',
  color: '#818cf8',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '0.8rem'
});

export const DashboardPage = () => {
  const {
    boards,
    isAdmin,
    createOpen,
    joinOpen,
    alertInfo,
    waitingApprovalOpen,
    setCreateOpen,
    setJoinOpen,
    setWaitingApprovalOpen,
    handleCreateBoard,
    handleJoinBoard,
    handleCloseAlert
  } = useDashboardLogic();

  return (
    <PageContainer>
      <ContentWrapper>
        <DashboardHeader isAdmin={isAdmin} />

        <ActionsContainer>
          <DashboardActionCard
            onClick={() => setCreateOpen(true)}
            icon={<AddIcon />}
            text="Create New Board"
            type="create"
          />
          <DashboardActionCard
            onClick={() => setJoinOpen(true)}
            icon={<JoinIcon />}
            text="Join Board"
            type="join"
          />
        </ActionsContainer>

        {boards.length > 0 && (
          <Box>
            <RecentBoardsHeader>
              {isAdmin ? "All Boards" : "Recent Boards"}
              <Badge>{boards.length}</Badge>
            </RecentBoardsHeader>
            <BoardGrid boards={boards} />
          </Box>
        )}

        <DashboardModals
          createOpen={createOpen}
          joinOpen={joinOpen}
          alertInfo={alertInfo}
          waitingApprovalOpen={waitingApprovalOpen}
          onCloseCreate={() => setCreateOpen(false)}
          onCloseJoin={() => setJoinOpen(false)}
          onCloseAlert={handleCloseAlert}
          onCloseWaiting={() => setWaitingApprovalOpen(false)}
          onCreateBoard={handleCreateBoard}
          onJoinBoard={handleJoinBoard}
        />
      </ContentWrapper>
    </PageContainer>
  );
};