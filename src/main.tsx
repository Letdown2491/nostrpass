import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/main.css";

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "[::1]";

const base =
  document.querySelector<HTMLBaseElement>("base")?.getAttribute("href") ?? "/";

if ("serviceWorker" in navigator) {
  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";

  if (location.protocol === "https:" || isLocal) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(`${base}sw.js`, { scope: base })
        .catch((err) =>
          console.error("Service worker registration failed:", err),
        );
    });
  } else {
    console.warn("Service worker disabled due to insecure context");
  }
}
