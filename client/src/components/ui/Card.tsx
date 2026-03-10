import { styled } from '@mui/material/styles';
import MuiCard from '@mui/material/Card';
import type { CardProps } from '@mui/material/Card';

export const Card = styled(MuiCard)<CardProps>(() => ({
  borderRadius: 24,
  padding: '2.5rem',
  background: 'rgba(30, 41, 59, 0.4)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
}));
