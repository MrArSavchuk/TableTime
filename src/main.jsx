import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const enableMock = import.meta.env.VITE_ENABLE_MSW === "true";

if (enableMock) {
  (async () => {
    try {
      const { worker } = await import("./mocks/browser");
      await worker.start({
        serviceWorker: { url: import.meta.env.BASE_URL + "mockServiceWorker.js" },
        onUnhandledRequest: "bypass",
      });
    } catch (e) {
      console.warn("MSW failed to start (app keeps working):", e);
    }
  })();
}
