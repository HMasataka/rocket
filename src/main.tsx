import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/variables.css";
import "./styles/shell.css";
import "./styles/components.css";
import "./styles/changes-view.css";
import "./styles/branches.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
