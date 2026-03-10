import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "../../../../store/index";
import { setConflict } from "../../../../store/sync/syncSlice";

export const ConflictModal = () => {

  const dispatch = useDispatch();

  const conflict = useSelector(
    (state: RootState) => state.sync.conflict
  );

  const handleClose = () => {
    dispatch(setConflict(false));
    window.location.reload();
  };

  return (

    <Dialog open={conflict}>

      <DialogTitle>
        Conflict Detected
      </DialogTitle>

      <DialogContent>
        Another user modified the same element.  
        The server version has been applied.
      </DialogContent>

      <DialogActions>

        <Button
          variant="contained"
          onClick={handleClose}
        >
          Refresh Board
        </Button>

      </DialogActions>

    </Dialog>

  );

};