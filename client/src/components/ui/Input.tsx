import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material/TextField';

const StyledTextField = styled(TextField)<TextFieldProps>(({ theme }) => ({
  marginTop: '1.25rem', // Make room for the top label
  '& .MuiInputLabel-root': {
    transform: 'translate(0, -1.25rem) scale(0.85)',
    transformOrigin: 'top left',
    color: theme.palette.text.primary,
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme.palette.primary.main,
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderColor: theme.palette.divider,
      top: 0,
    },
    '& fieldset legend': {
      display: 'none', 
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

export const Input = (props: TextFieldProps) => {
  return (
    <StyledTextField
      {...props}
      InputLabelProps={{
        shrink: true,
        ...props.InputLabelProps,
      }}
    />
  );
};
