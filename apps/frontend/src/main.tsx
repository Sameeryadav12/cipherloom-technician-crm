import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { AppErrorBoundary } from "@/components/error/app-error-boundary";
import { AppProviders } from "@/providers/app-providers";
import "@/index.css";

document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </AppErrorBoundary>
  </React.StrictMode>
);

