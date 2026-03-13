import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface LayerNotification {
  id: string;
  message: string;
  timestamp: number;
}

interface NotificationsState {
  notifications: LayerNotification[];
}

const initialState: NotificationsState = {
  notifications: []
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,

  reducers: {
    addNotification: (state, action: PayloadAction<{ id: string; message: string }>) => {
      state.notifications.push({
        ...action.payload,
        timestamp: Date.now()
      });
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    }
  }
});

export const {
  addNotification,
  removeNotification
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
