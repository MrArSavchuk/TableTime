import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);

if (import.meta.env.DEV) {
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
