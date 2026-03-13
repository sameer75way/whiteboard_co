import { Typography, Box, keyframes } from "@mui/material";
import { useMemo } from "react";
import { useGetBoardsQuery } from "../../services/api/boardApi";
import { BoardGrid } from "../Dashboard/components/BoardGrid";
import { styled } from '@mui/material/styles';

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

const HeaderContainer = styled(Box)({
  marginBottom: "48px",
});

const PageTitle = styled(Typography)({
  fontWeight: 800,
  display: 'inline-block',
  background: 'linear-gradient(to right, #e0e7ff, #818cf8)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: "-0.5px"
});

const PageSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '1.1rem',
  marginTop: '8px'
}));

const EmptyStateText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textAlign: 'center',
  marginTop: theme.spacing(8)
}));

export const HistoryPage = () => {
  const { data } = useGetBoardsQuery(null);
  const boards = useMemo(() => data?.data || [], [data]);

  return (
    <PageContainer>
      <ContentWrapper>
        <HeaderContainer>
          <PageTitle variant="h4" gutterBottom>
            Recent Boards
          </PageTitle>
          <PageSubtitle variant="body1">
            Browse all the whiteboards you have created or joined recently.
          </PageSubtitle>
        </HeaderContainer>

        {boards.length > 0 ? (
          <BoardGrid boards={boards} />
        ) : (
          <EmptyStateText>
            No recent boards found. Head to the dashboard to create or join one!
          </EmptyStateText>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};
