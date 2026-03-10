import { styled } from '@mui/material/styles';
import MuiButton from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';

export const Button = styled((props: ButtonProps) => (
  <MuiButton variant="contained" disableElevation {...props} />
))(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  padding: '12px 24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: '#fff',
  '&:hover': {
    transform: 'translateY(-2px) scale(1.02)',
    boxShadow: `0 10px 25px -5px ${theme.palette.primary.main}80`,
  },
  '&:disabled': {
    background: theme.palette.action.disabledBackground,
    color: theme.palette.text.disabled,
  }
}));

export const TextButton = styled((props: ButtonProps) => (
  <MuiButton variant="text" disableElevation {...props} />
))(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  padding: '8px 16px',
  color: theme.palette.text.secondary,
  transition: 'color 0.2s ease',
  '&:hover': {
    backgroundColor: 'transparent',
    color: theme.palette.primary.light,
  },
}));
