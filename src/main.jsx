import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

async function bootstrap() {
  const shouldEnableMsw =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW === "true";

  if (shouldEnableMsw) {
    try {
      const { worker } = await import("./mocks/browser");
      await worker.start({
        serviceWorker: { url: "/mockServiceWorker.js" },
        onUnhandledRequest: "bypass",
      });
    } catch (e) {
      console.warn("MSW failed to start (app keeps working):", e);
    }
  }

  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
