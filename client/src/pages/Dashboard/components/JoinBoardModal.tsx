import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";
import { styled } from "@mui/material/styles";

interface Props {
  open: boolean;
  onClose: () => void;
  onJoin: (shareCode: string) => void;
}

const StyledTextField = styled(TextField)({
  marginTop: "8px"
});

const joinSchema = z.object({
  code: z.string().trim().min(1, "Share code is required")
});

type JoinFormData = z.infer<typeof joinSchema>;

export const JoinBoardModal = ({
  open,
  onClose,
  onJoin
}: Props) => {

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema)
  });

  const onSubmit = (data: JoinFormData) => {
    onJoin(data.code);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Join Board</DialogTitle>
        <DialogContent>
          <StyledTextField
            fullWidth
            label="Share Code"
            placeholder="Enter the board's share code"
            {...register("code")}
            error={!!errors.code}
            helperText={errors.code?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" type="submit">
            Join
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
