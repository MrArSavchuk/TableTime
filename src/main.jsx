import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err) {
    return { error: err };
  }
  componentDidCatch(error, info) {
    console.error("Root error boundary caught:", error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, color: "white" }}>
          <h2>Something went wrong</h2>
          <p className="muted">The app hit a runtime error. Check the console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

async function enableMocksIfNeeded() {
  const enabled =
    import.meta.env.DEV ||
    String(import.meta.env.VITE_ENABLE_MSW).toLowerCase() === "true";

  if (!enabled) return;

  try {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      serviceWorker: { url: import.meta.env.BASE_URL + "mockServiceWorker.js" },
      onUnhandledRequest: "bypass",
    });
    await new Promise((r) => setTimeout(r, 50));
  } catch (e) {
    console.warn("MSW failed to start (app keeps working):", e);
  }
}

(async () => {
  await enableMocksIfNeeded();

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
})();
