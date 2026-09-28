import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PlaygroundApp } from "./components/web";

const container = document.getElementById("playground-root");

if (!container) {
  throw new Error(
    'The playground root element "#playground-root" was not found.'
  );
}

createRoot(container).render(
  <StrictMode>
    <PlaygroundApp />
  </StrictMode>
);
