import { createRoot } from "react-dom/client";

// Defer PDF.js worker configuration to avoid pulling pdfjs-dist into the critical chain.
// It will be configured lazily when a PDF component first loads.
// import "./lib/pdfjsWorker";

import App from "./App.tsx";
import "./index.css";

// Auto-reload on stale dynamic import failures (e.g. after a deploy)
window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason?.message?.includes("Failed to fetch dynamically imported module") ||
    event.reason?.message?.includes("Importing a module script failed")
  ) {
    console.warn("Stale chunk detected, reloading…");
    event.preventDefault();
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
