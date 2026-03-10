import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ProtectedRoute } from '../layouts/ProtectedRoute';
import { PublicRoute } from '../layouts/PublicRoute';
import { MainLayout } from '../layouts/MainLayout';

const LandingPage = lazy(() => import('../pages/Landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../pages/Auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../pages/Auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const HistoryPage = lazy(() => import('../pages/History/HistoryPage').then(m => ({ default: m.HistoryPage })));
const WhiteboardPage = lazy(() => import('../pages/Whiteboard/WhiteboardPage').then(m => ({ default: m.WhiteboardPage })));
const AdminUsersPage = lazy(() => import('../pages/Admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));

import { styled } from '@mui/material/styles';

const StyledFallbackBox = styled(Box)({
  display: 'flex',
  height: '100vh',
  alignItems: 'center',
  justifyContent: 'center'
});

const LoadingFallback = () => (
  <StyledFallbackBox>
    <CircularProgress />
  </StyledFallbackBox>
);

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: '/', element: <Suspense fallback={<LoadingFallback />}><LandingPage /></Suspense> },
      { path: '/login', element: <Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense> },
      { path: '/register', element: <Suspense fallback={<LoadingFallback />}><RegisterPage /></Suspense> },
      { path: '/forgot-password', element: <Suspense fallback={<LoadingFallback />}><ForgotPasswordPage /></Suspense> },
      { path: '/reset-password/:token', element: <Suspense fallback={<LoadingFallback />}><ResetPasswordPage /></Suspense> },
    ],
  },
  
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/dashboard', element: <Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense> },
          { path: '/history', element: <Suspense fallback={<LoadingFallback />}><HistoryPage /></Suspense> },
          { path: '/board/:id', element: <Suspense fallback={<LoadingFallback />}><WhiteboardPage /></Suspense> },
          { path: '/admin/users', element: <Suspense fallback={<LoadingFallback />}><AdminUsersPage /></Suspense> },
          { path: '*', element: <Navigate to="/dashboard" replace /> }
        ],
      },
    ],
  },
  
  { path: '*', element: <Navigate to="/" replace /> }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};