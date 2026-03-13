import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CanvasElement } from "../../types/element.types";
import type { Layer } from "../../types/board.types";

export interface SnapshotListItem {
  id: string;
  boardId: string;
  type: "auto" | "manual" | "restore";
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface SnapshotDetail extends SnapshotListItem {
  state: {
    elements: CanvasElement[];
    layers: Layer[];
  };
}

interface SnapshotState {
  snapshots: SnapshotListItem[];
  totalSnapshots: number;
  currentPage: number;
  isPreviewOpen: boolean;
  previewSnapshot: SnapshotDetail | null;
  lastAutoSaveAt: string | null;
}

const initialState: SnapshotState = {
  snapshots: [],
  totalSnapshots: 0,
  currentPage: 1,
  isPreviewOpen: false,
  previewSnapshot: null,
  lastAutoSaveAt: null
};

const snapshotSlice = createSlice({
  name: "snapshot",
  initialState,

  reducers: {
    setSnapshots: (
      state,
      action: PayloadAction<{ snapshots: SnapshotListItem[]; total: number; page: number }>
    ) => {
      state.snapshots = action.payload.snapshots;
      state.totalSnapshots = action.payload.total;
      state.currentPage = action.payload.page;
    },

    prependSnapshot: (state, action: PayloadAction<SnapshotListItem>) => {
      state.snapshots.unshift(action.payload);
      state.totalSnapshots += 1;
    },

    setPreviewOpen: (state, action: PayloadAction<boolean>) => {
      state.isPreviewOpen = action.payload;
    },

    setPreviewSnapshot: (state, action: PayloadAction<SnapshotDetail | null>) => {
      state.previewSnapshot = action.payload;
    },

    setLastAutoSaveAt: (state, action: PayloadAction<string>) => {
      state.lastAutoSaveAt = action.payload;
    }
  }
});

export const {
  setSnapshots,
  prependSnapshot,
  setPreviewOpen,
  setPreviewSnapshot,
  setLastAutoSaveAt
} = snapshotSlice.actions;

export const selectSnapshots = (state: { snapshot: SnapshotState }) =>
  state.snapshot.snapshots;
export const selectTotalSnapshots = (state: { snapshot: SnapshotState }) =>
  state.snapshot.totalSnapshots;
export const selectIsPreviewOpen = (state: { snapshot: SnapshotState }) =>
  state.snapshot.isPreviewOpen;
export const selectPreviewSnapshot = (state: { snapshot: SnapshotState }) =>
  state.snapshot.previewSnapshot;
export const selectLastAutoSaveAt = (state: { snapshot: SnapshotState }) =>
  state.snapshot.lastAutoSaveAt;

export default snapshotSlice.reducer;
