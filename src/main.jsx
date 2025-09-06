import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) {
    console.error("Root error boundary caught:", err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Something went wrong</h2>
          <p className="muted">
            The app hit a runtime error. Please reload the page. If this keeps
            happening, copy the error from the browser console and share it.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

const enableMSW =
  import.meta.env.DEV || String(import.meta.env.VITE_ENABLE_MSW).toLowerCase() === "true";

if (enableMSW) {
  (async () => {
    try {
      const { worker } = await import("./mocks/browser");
      await worker.start({
        serviceWorker: { url: import.meta.env.BASE_URL + "mockServiceWorker.js" },
        onUnhandledRequest: "bypass",
      });
      console.info("[MSW] Mocking enabled.");
    } catch (e) {
      console.warn("MSW failed to start (app keeps working):", e);
    }
  })();
}
