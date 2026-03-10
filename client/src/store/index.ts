import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import syncReducer from "./sync/syncSlice";
import authReducer from "./auth/authSlice";

import canvasReducer from "./canvas/canvasSlice";
import collabReducer from "./collaboration/collabSlice";

import { baseApi } from "../services/api/baseApi";

const persistConfig = {
  key: 'auth',
  storage,
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,

    canvas: canvasReducer,
    collaboration: collabReducer,
    sync: syncReducer,
    [baseApi.reducerPath]: baseApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER', 'persist/PAUSE', 'persist/PURGE', 'persist/FLUSH'],
      },
    }).concat(baseApi.middleware)
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;