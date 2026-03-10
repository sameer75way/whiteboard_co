import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreateBoardModal = ({
  open,
  onClose,
  onCreate
}: Props) => {

  const [name, setName] = useState("");

  const handleCreate = () => {

    if (!name.trim()) return;

    onCreate(name);

    setName("");

  };

  return (

    <Dialog open={open} onClose={onClose}>

      <DialogTitle>Create Board</DialogTitle>

      <DialogContent>

        <TextField
          fullWidth
          label="Board name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

      </DialogContent>

      <DialogActions>

        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          onClick={handleCreate}
        >
          Create
        </Button>

      </DialogActions>

    </Dialog>

  );

};