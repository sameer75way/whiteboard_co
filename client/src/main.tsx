import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./lib/theme/theme";
import { SnackbarProvider } from "notistack";

import { Provider } from "react-redux";

import { store, persistor } from "./store/index";
import { PersistGate } from 'redux-persist/integration/react';

import { AppRouter } from "./routes";
import { GlobalErrorBoundary } from "./layouts/GlobalErrorBoundary";

const bootFallbackStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%)",
  color: "#1f2937",
  fontWeight: 700,
  letterSpacing: "0.2px"
};

const appBootFallback = <div style={bootFallbackStyle}>Loading Whiteboard...</div>;

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={appBootFallback} persistor={persistor}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider maxSnack={3}>
              <AppRouter />
            </SnackbarProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);