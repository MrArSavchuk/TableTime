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
            The app hit a runtime error. Please reload the page. Check console for details.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

async function bootstrap() {
  const enableMSW =
    import.meta.env.DEV ||
    String(import.meta.env.VITE_ENABLE_MSW).toLowerCase() === "true";

  if (enableMSW) {
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
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
}

bootstrap();
