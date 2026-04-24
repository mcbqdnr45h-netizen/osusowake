import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./index.css";

// Set up Google Maps error dialog suppression BEFORE any map component renders.
// gm_authFailure is called by Google Maps API on authentication failure.
// Defining it prevents the default error overlay from showing.
(window as any).gm_authFailure = function () {
  try {
    document.querySelectorAll<HTMLElement>(
      '.gm-err-container, .gm-err-dialog, [class*="gm-err"]'
    ).forEach(el => {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    });
  } catch (_) {}
};

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
