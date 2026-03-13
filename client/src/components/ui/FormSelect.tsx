import ReactSelect from 'react-select';
import type { Props as SelectProps } from 'react-select';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface FormSelectProps<TFieldValues extends FieldValues> extends Omit<SelectProps, 'name' | 'defaultValue' | 'onChange'> {
  name: UseControllerProps<TFieldValues>['name'];
  control: UseControllerProps<TFieldValues>['control'];
  label?: string;
  error?: string;
  onChangeCallback?: (value: string | null) => void;
}

export const FormSelect = <TFieldValues extends FieldValues>({
  name,
  control,
  label,
  error,
  options,
  onChangeCallback,
  ...rest
}: FormSelectProps<TFieldValues>) => {
  const {
    field: { value, onChange, onBlur, ref },
  } = useController({ name, control });

  const theme = useTheme();

  return (
    <Box width="100%">
      {label && (
        <Typography variant="body2" color="text.secondary" mb={1}>
          {label}
        </Typography>
      )}
      <ReactSelect
        ref={ref}
        value={(options as { value: string; label: string }[])?.find((c) => c.value === value) || null}
        onChange={(val) => {
          const selected = val as { value: string; label: string } | null;
          const newValue = selected ? selected.value : null;
          onChange(newValue);
          if (onChangeCallback) onChangeCallback(newValue);
        }}
        onBlur={onBlur}
        options={options}
        styles={{
          control: (base, state) => ({
            ...base,
            backgroundColor: theme.palette.background.paper,
            borderColor: state.isFocused ? theme.palette.primary.main : theme.palette.divider,
            boxShadow: state.isFocused ? `0 0 0 1px ${theme.palette.primary.main}` : 'none',
            '&:hover': {
              borderColor: state.isFocused ? theme.palette.primary.main : theme.palette.text.secondary,
            },
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: theme.palette.background.paper,
            zIndex: 9999,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected 
              ? theme.palette.primary.main 
              : state.isFocused 
                ? theme.palette.action.hover 
                : 'transparent',
            color: state.isSelected ? theme.palette.primary.contrastText : theme.palette.text.primary,
            '&:hover': {
              backgroundColor: state.isSelected ? theme.palette.primary.main : theme.palette.action.hover,
            },
          }),
          singleValue: (base) => ({
            ...base,
            color: theme.palette.text.primary,
          }),
        }}
        {...rest}
      />
      {error && (
        <Typography color="error" variant="caption" mt={0.5}>
          {error}
        </Typography>
      )}
    </Box>
  );
};
