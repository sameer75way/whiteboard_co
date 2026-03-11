import { useEffect } from 'react';
import { Box, styled } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { JoinRequestModal } from './components/JoinRequestModal';
import { useSocket } from '../hooks/useSocket';
import { socket } from '../services/socket/socketClient';
import { baseApi } from '../services/api/baseApi';
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
  const dispatch = useDispatch();

  useSocket(token!);

  useEffect(() => {
    if (!token) return;

    const handleGlobalBoardUpdate = () => {
      dispatch(baseApi.util.invalidateTags(['Board']));
    };

    socket.on('board:deleted', handleGlobalBoardUpdate);
    socket.on('board:removed', handleGlobalBoardUpdate);
    socket.on('board:role_updated', handleGlobalBoardUpdate);
    socket.on('board:members_updated', handleGlobalBoardUpdate);
    socket.on('board:join_request', handleGlobalBoardUpdate);

    return () => {
      socket.off('board:deleted', handleGlobalBoardUpdate);
      socket.off('board:removed', handleGlobalBoardUpdate);
      socket.off('board:role_updated', handleGlobalBoardUpdate);
      socket.off('board:members_updated', handleGlobalBoardUpdate);
      socket.off('board:join_request', handleGlobalBoardUpdate);
    };
  }, [dispatch, token]);

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
