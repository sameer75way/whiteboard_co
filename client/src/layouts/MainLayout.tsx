import { Box, styled } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { JoinRequestModal } from './components/JoinRequestModal';
import { useSocket } from '../hooks/useSocket';
import type { RootState } from '../store/index';

const RootRoot = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
});

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isBoard'
})<{ isBoard?: boolean }>(({ theme, isBoard }) => ({
  flexGrow: 1,
  padding: isBoard ? 0 : theme.spacing(3),
  marginTop: '64px',
  height: 'calc(100vh - 64px)',
  overflow: isBoard ? 'hidden' : 'auto',
  backgroundColor: theme.palette.background.default,
}));

export const MainLayout = () => {
  const location = useLocation();
  const isBoard = location.pathname.startsWith('/board/');
  const token = useSelector((state: RootState) => state.auth.accessToken);

  useSocket(token!);

  return (
    <RootRoot>
      <Navbar />
      <Sidebar />
      <MainContent isBoard={isBoard}>
        <Outlet />
      </MainContent>
      <JoinRequestModal />
    </RootRoot>
  );
};
