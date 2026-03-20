import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { LandingPage } from '../pages/Landing/LandingPage';

const ProtectedRoute = lazy(() => import('../layouts/ProtectedRoute').then(m => ({ default: m.ProtectedRoute })));
const PublicRoute = lazy(() => import('../layouts/PublicRoute').then(m => ({ default: m.PublicRoute })));
const MainLayout = lazy(() => import('../layouts/MainLayout').then(m => ({ default: m.MainLayout })));

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

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<LoadingFallback />}>
    {element}
  </Suspense>
);

const router = createBrowserRouter([
  {
    element: withSuspense(<PublicRoute />),
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: withSuspense(<LoginPage />) },
      { path: '/register', element: withSuspense(<RegisterPage />) },
      { path: '/forgot-password', element: withSuspense(<ForgotPasswordPage />) },
      { path: '/reset-password/:token', element: withSuspense(<ResetPasswordPage />) },
    ],
  },
  
  {
    element: withSuspense(<ProtectedRoute />),
    children: [
      {
        element: withSuspense(<MainLayout />),
        children: [
          { path: '/dashboard', element: withSuspense(<DashboardPage />) },
          { path: '/history', element: withSuspense(<HistoryPage />) },
          { path: '/board/:id', element: withSuspense(<WhiteboardPage />) },
          { path: '/admin/users', element: withSuspense(<AdminUsersPage />) },
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