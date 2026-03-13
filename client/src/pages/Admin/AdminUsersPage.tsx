import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import { useGetAllUsersQuery } from "../../services/api/authApi";
import { useGetAllBoardsQuery } from "../../services/api/boardApi";
import { UserList } from "./components/UserList";
import type { AdminUser } from "./components/UserBoardCard";
import type { Board as BoardData } from "../../types/board.types";

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
  maxWidth: 1200,
  margin: "0 auto",
  position: 'relative',
  zIndex: 1,
});

const HeaderSection = styled(Box)({
  marginBottom: '2rem',
  borderBottom: `1px solid rgba(255,255,255,0.1)`,
  paddingBottom: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});

const LoaderContainer = styled(PageContainer)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
});

const StyledCircularProgress = styled(CircularProgress)({
  color: '#818cf8'
});

const ErrorAlert = styled(Alert)({
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: '#ef4444'
});

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  color: theme.palette.text.primary
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary
}));

export const AdminUsersPage = () => {
  const { data: usersData, isLoading: isUsersLoading, error: usersError } = useGetAllUsersQuery(undefined);
  const { data: boardsData, isLoading: isBoardsLoading, error: boardsError } = useGetAllBoardsQuery(undefined);

  const isLoading = isUsersLoading || isBoardsLoading;
  const isError = usersError || boardsError;

  if (isLoading) {
    return (
      <LoaderContainer>
        <StyledCircularProgress size={60} />
      </LoaderContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <ContentWrapper>
          <ErrorAlert severity="error">
            Failed to load admin data. Ensure you have the correct permissions.
          </ErrorAlert>
        </ContentWrapper>
      </PageContainer>
    );
  }

  const users: AdminUser[] = usersData?.data || [];
  const boards: BoardData[] = boardsData?.data || [];

  return (
    <PageContainer>
      <ContentWrapper>
        <HeaderSection>
          <Title variant="h4">
            Admin Control Panel
          </Title>
          <Subtitle variant="subtitle1">
            Manage all registered users and their whiteboard associations.
          </Subtitle>
        </HeaderSection>
        
        <UserList users={users} boards={boards} />
      </ContentWrapper>
    </PageContainer>
  );
};
