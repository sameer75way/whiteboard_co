import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material/TextField';

export const Input = styled(TextField)<TextFieldProps>(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${theme.palette.primary.light}`,
    },
  },
}));
