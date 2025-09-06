import React, { useEffect, useState } from "react";
import BookingForm from "./components/BookingForm";
import ManageBooking from "./components/ManageBooking";
import "./styles.css";

class SectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err) {
    return { error: err };
  }
  componentDidCatch(error, info) {
    console.error(`[SectionBoundary:${this.props.name}]`, error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ borderColor: "#ef4444aa" }}>
          <h3 style={{ margin: 0 }}>{this.props.name} failed to render</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            Open console for the stack trace. You can still use the rest of the app.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("tt-theme") || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("tt-theme", theme);
  }, [theme]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <button
          className="mode"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>

        <h1 className="brand">TableTime</h1>
        <p className="tag">Table reservation service</p>
      </aside>

      <main className="main">
        <SectionBoundary name="BookingForm">
          <BookingForm />
        </SectionBoundary>

        <SectionBoundary name="ManageBooking" >
          <ManageBooking />
        </SectionBoundary>
      </main>
    </div>
  );
}
