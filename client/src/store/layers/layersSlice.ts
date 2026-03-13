import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Layer } from "../../types/board.types";

interface LayersState {
  layers: Layer[];
  activeLayerId: string | null;
}

const initialState: LayersState = {
  layers: [],
  activeLayerId: null
};

const layersSlice = createSlice({
  name: "layers",
  initialState,

  reducers: {
    setLayers: (state, action: PayloadAction<Layer[]>) => {
      state.layers = [...action.payload].sort((a, b) => b.order - a.order);
      if (state.layers.length > 0 && !state.activeLayerId) {
        state.activeLayerId = state.layers[0].id;
      }
      if (state.activeLayerId && !state.layers.some((l) => l.id === state.activeLayerId)) {
        state.activeLayerId = state.layers.length > 0 ? state.layers[0].id : null;
      }
    },

    addLayer: (state, action: PayloadAction<Layer>) => {
      state.layers.push(action.payload);
      state.layers.sort((a, b) => b.order - a.order);
    },

    updateLayer: (state, action: PayloadAction<{ layerId: string; changes: Partial<Omit<Layer, "id">> }>) => {
      const layer = state.layers.find((l) => l.id === action.payload.layerId);
      if (layer) {
        Object.assign(layer, action.payload.changes);
      }
    },

    removeLayer: (state, action: PayloadAction<{ layerId: string }>) => {
      state.layers = state.layers.filter((l) => l.id !== action.payload.layerId);
      if (state.activeLayerId === action.payload.layerId) {
        state.activeLayerId = state.layers.length > 0 ? state.layers[0].id : null;
      }
    },

    reorderLayers: (state, action: PayloadAction<string[]>) => {
      const orderedIds = action.payload;
      orderedIds.forEach((id, index) => {
        const layer = state.layers.find((l) => l.id === id);
        if (layer) layer.order = index;
      });
      state.layers.sort((a, b) => b.order - a.order);
    },

    setActiveLayer: (state, action: PayloadAction<string>) => {
      state.activeLayerId = action.payload;
    }
  }
});

export const {
  setLayers,
  addLayer,
  updateLayer,
  removeLayer,
  reorderLayers,
  setActiveLayer
} = layersSlice.actions;

export default layersSlice.reducer;
