import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CanvasElement } from "../../types/element.types";

const MAX_HISTORY = 30;

interface CanvasState {
  elements: Record<string, CanvasElement>;
  selectedElementId: string | null;
  historyPast: Record<string, CanvasElement>[];
  historyFuture: Record<string, CanvasElement>[];
}

const initialState: CanvasState = {
  elements: {},
  selectedElementId: null,
  historyPast: [],
  historyFuture: []
};

function pushHistory(state: CanvasState) {
  state.historyPast.push(JSON.parse(JSON.stringify(state.elements)));
  if (state.historyPast.length > MAX_HISTORY) {
    state.historyPast.shift();
  }
  state.historyFuture = [];
}

const canvasSlice = createSlice({
  name: "canvas",
  initialState,

  reducers: {

    addElement: (state, action: PayloadAction<CanvasElement>) => {
      pushHistory(state);
      state.elements[action.payload._id] = action.payload;
    },

    updateElement: (state, action: PayloadAction<CanvasElement>) => {
      pushHistory(state);
      const el = action.payload;
      delete state.elements[el._id];
      state.elements[el._id] = el;
    },

    deleteElement: (state, action: PayloadAction<string>) => {
      pushHistory(state);
      if (state.selectedElementId === action.payload) {
        state.selectedElementId = null;
      }
      delete state.elements[action.payload];
    },

    addElementLocally: (state, action: PayloadAction<CanvasElement>) => {
      state.elements[action.payload._id] = action.payload;
    },

    updateElementLocally: (state, action: PayloadAction<CanvasElement>) => {
      const el = action.payload;
      delete state.elements[el._id];
      state.elements[el._id] = el;
    },

    deleteElementLocally: (state, action: PayloadAction<string>) => {
      if (state.selectedElementId === action.payload) {
        state.selectedElementId = null;
      }
      delete state.elements[action.payload];
    },

    patchElementPosition: (state, action: PayloadAction<{ elementId: string; x: number; y: number }>) => {
      const el = state.elements[action.payload.elementId];
      if (el) {
        el.position = { x: action.payload.x, y: action.payload.y };
      }
    },

    selectElement: (state, action: PayloadAction<string | null>) => {
      state.selectedElementId = action.payload;
      if (action.payload && state.elements[action.payload]) {
        const el = state.elements[action.payload];
        delete state.elements[action.payload];
        state.elements[action.payload] = el;
      }
    },

    setElements: (state, action: PayloadAction<CanvasElement[]>) => {
      state.elements = {};
      action.payload.forEach((el) => {
        state.elements[el._id] = el;
      });
    },

    deleteElementsFromLayer: (state, action: PayloadAction<string>) => {
      pushHistory(state);
      const layerId = action.payload;
      Object.keys(state.elements).forEach((id) => {
        if (state.elements[id].layerId === layerId) {
          delete state.elements[id];
          if (state.selectedElementId === id) {
            state.selectedElementId = null;
          }
        }
      });
    },

    updateMultipleElementsLocally: (state, action: PayloadAction<CanvasElement[]>) => {
      action.payload.forEach((el) => {
        state.elements[el._id] = el;
      });
    },

    undo: (state) => {
      if (state.historyPast.length === 0) return;
      const previous = state.historyPast.pop()!;
      state.historyFuture.push(JSON.parse(JSON.stringify(state.elements)));
      state.elements = previous;
    },

    redo: (state) => {
      if (state.historyFuture.length === 0) return;
      const next = state.historyFuture.pop()!;
      state.historyPast.push(JSON.parse(JSON.stringify(state.elements)));
      state.elements = next;
    }
  }
});

export const {
  addElement,
  updateElement,
  deleteElement,
  addElementLocally,
  updateElementLocally,
  deleteElementLocally,
  patchElementPosition,
  selectElement,
  setElements,
  deleteElementsFromLayer,
  updateMultipleElementsLocally,
  undo,
  redo
} = canvasSlice.actions;

export default canvasSlice.reducer;