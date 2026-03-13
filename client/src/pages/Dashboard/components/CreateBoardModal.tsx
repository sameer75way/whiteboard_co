import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";

const schema = z.object({
  name: z.string().min(1, "Board name is required")
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreateBoardModal = ({ open, onClose, onCreate }: Props) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" }
  });

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = (data: FormValues) => {
    onCreate(data.name.trim());
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Board</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="Board name"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                autoFocus
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} type="button">Cancel</Button>
          <Button variant="contained" type="submit">Create</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};