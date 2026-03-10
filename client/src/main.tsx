import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./lib/theme/theme";

import { Provider } from "react-redux";

import { store, persistor } from "./store/index";
import { PersistGate } from 'redux-persist/integration/react';

import { AppRouter } from "./routes";
import { GlobalErrorBoundary } from "./layouts/GlobalErrorBoundary";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppRouter />
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);