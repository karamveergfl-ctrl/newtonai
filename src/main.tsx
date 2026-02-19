import { createRoot } from "react-dom/client";

// Defer PDF.js worker configuration to avoid pulling pdfjs-dist into the critical chain.
// It will be configured lazily when a PDF component first loads.
// import "./lib/pdfjsWorker";

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
