import { createSlice,type PayloadAction } from "@reduxjs/toolkit";

interface SyncState {
  syncing: boolean;
  conflict: boolean;
}

const initialState: SyncState = {
  syncing: false,
  conflict: false
};

const syncSlice = createSlice({
  name: "sync",
  initialState,
  reducers: {

    startSync(state) {
      state.syncing = true;
    },

    finishSync(state) {
      state.syncing = false;
    },

    setConflict(state, action: PayloadAction<boolean>) {
      state.conflict = action.payload;
    }

  }
});

export const {
  startSync,
  finishSync,
  setConflict
} = syncSlice.actions;

export default syncSlice.reducer;