import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Cursor {
  userId: string;
  name?: string;
  x: number;
  y: number;
}

interface CollabState {
  cursors: Record<string, Cursor>;
}

const initialState: CollabState = {
  cursors: {}
};

const collabSlice = createSlice({
  name: "collaboration",
  initialState,

  reducers: {

    updateCursor: (state, action: PayloadAction<Cursor>) => {

      const cursor = action.payload;

      state.cursors[cursor.userId] = cursor;

    },

    removeCursor: (state, action: PayloadAction<string>) => {

      delete state.cursors[action.payload];

    }

  }

});

export const {
  updateCursor,
  removeCursor
} = collabSlice.actions;

export default collabSlice.reducer;