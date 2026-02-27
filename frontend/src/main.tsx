import React from "react";
import ReactDOM from "react-dom/client";
import { setupIonicReact } from "@ionic/react";
import App from "./App";

/* Ionic core CSS */
import "@ionic/react/css/core.css";

/* Ionic basic CSS - needed for Ionic components to work */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

setupIonicReact();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
