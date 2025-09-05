import { useEffect, useState } from "react";
import BookingForm from "./components/BookingForm";
import ManageBooking from "./components/ManageBooking";
import "./styles.css";

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
        <BookingForm />
        <ManageBooking />
      </main>
    </div>
  );
}
