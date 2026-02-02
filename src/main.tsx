import { createRoot } from "react-dom/client";

// Configure PDF.js worker globally BEFORE any PDF components load
import "./lib/pdfjsWorker";

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
