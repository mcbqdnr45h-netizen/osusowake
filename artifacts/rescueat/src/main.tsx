// MUST be first import — sets up Google Maps error dialog suppression
// before any other code runs.
import "./lib/cap-maps-fix";

import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
