import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

/* ────────────────
   Small helpers
   ──────────────── */

// Live input mask → keep only digits, format as MM/DD/YYYY while typing.
const maskDate = (v) => {
  const d = (v || "").replace(/\D/g, "").slice(0, 8);
  const mm = d.slice(0, 2), dd = d.slice(2, 4), yyyy = d.slice(4, 8);
  return [mm, dd, yyyy].filter(Boolean).join("/");
};

// Convert "MM/DD/YYYY" → "YYYY-MM-DD" (API shape).
const toISO = (mmddyyyy) => {
  const m = mmddyyyy.slice(0, 2), d = mmddyyyy.slice(3, 5), y = mmddyyyy.slice(6, 10);
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

// Convert ISO "YYYY-MM-DD" → "MM/DD/YYYY" (for display).
const isoToMMDDYYYY = (iso) => {
  if (!iso || !iso.includes("-")) return iso;
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
};

export default function ManageBooking() {
  // React Hook Form for search controls (email + optional date).
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: { email: "", date: "" }
  });

  // List of found bookings; top-level error message; and restaurants directory.
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [restaurants, setRestaurants] = useState([]);

  // Reschedule dialog state:
  // - editing: booking currently being edited (or null)
  // - slots: available time slots for chosen date
  // - newDate/newTime: pending values inside the dialog
  // - saving: PATCH in progress
  // - dialogErr: error shown inside the dialog
  const [editing, setEditing] = useState(null);
  const [slots, setSlots] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogErr, setDialogErr] = useState("");

  // Fast lookup map: restaurantId -> restaurantName (memoized).
  const restById = useMemo(() => {
    const map = new Map();
    restaurants.forEach((r) => map.set(r.id, r.name));
    return map;
  }, [restaurants]);

  // Load restaurants once (used for pretty names in the list and dialog).
  useEffect(() => {
    fetch("/api/restaurants")
      .then(r => r.json())
      .then(setRestaurants)
      .catch(() => setRestaurants([]));
  }, []);

  // Submit handler for the search form.
  const onSearch = async ({ email, date }) => {
    setError("");
    setItems([]);
    // Build query string based on provided inputs.
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (date && /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/.test(date)) {
      params.set("date", toISO(date));
    }
    // Call GET /api/bookings?email=..&date=..
    const res = await fetch(`/api/bookings?${params.toString()}`);
    if (!res.ok) {
      setError("Failed to fetch bookings");
      return;
    }
    const list = await res.json();
    setItems(Array.isArray(list) ? list : []);
  };

  // Cancel a specific booking by code (DELETE /api/bookings/:code).
  const cancelBooking = async (code) => {
    setError("");
    const res = await fetch(`/api/bookings/${code}`, { method: "DELETE" });
    if (res.status === 204) {
      // Optimistically remove it from UI.
      setItems((xs) => xs.filter((x) => x.code !== code));
    } else {
      const msg = await res.json().catch(() => ({}));
      setError(msg.message || "Failed to cancel booking");
    }
  };

  // Open reschedule dialog, prefill fields, and fetch slots for current date.
  const openReschedule = async (b) => {
    setDialogErr("");
    setEditing(b);
    const d = isoToMMDDYYYY(b.date);
    setNewDate(d);
    setNewTime(b.time || "");
    await loadSlots(b.restaurant, d);
  };

  // Load available slots for (restaurantId, MM/DD/YYYY) combo.
  const loadSlots = async (restId, mmddyyyy) => {
    setSlots([]);
    if (!mmddyyyy || mmddyyyy.length < 10) return;
    const iso = toISO(mmddyyyy);
    const res = await fetch(`/api/availability?restaurant=${encodeURIComponent(restId)}&date=${iso}`);
    if (res.ok) {
      const data = await res.json();
      setSlots(Array.isArray(data.slots) ? data.slots : []);
    }
  };

  // Save reschedule → PATCH /api/bookings/:code with new date/time.
  const saveReschedule = async () => {
    if (!editing) return;
    setDialogErr("");
    if (!newDate || !newTime) {
      setDialogErr("Pick date and time.");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/bookings/${editing.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: toISO(newDate), time: newTime })
      });
      // 409 → chosen slot just became unavailable.
      if (res.status === 409) {
        const { message } = await res.json();
        setDialogErr(message || "Selected time slot is no longer available.");
        setSaving(false);
        return;
      }
      // Other errors.
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({}));
        throw new Error(message || "Failed to reschedule");
      }
      // Success → replace the item in the list and close dialog.
      const updated = await res.json();
      setItems((xs) => xs.map((x) => x.code === updated.code ? updated : x));
      setEditing(null);
    } catch (e) {
      setDialogErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <h2>Manage bookings</h2>
      <p className="muted">Find and cancel or reschedule your reservations.</p>

      {/* Top-level error banner for search/cancel actions */}
      {error && (
        <div className="card" style={{ borderColor: "#ef4444aa", marginBottom: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Search form: email + optional date */}
      <form className="form" onSubmit={handleSubmit(onSearch)} noValidate>
        <div className="grid">
          <div className="field">
            <label htmlFor="mb-email">Email</label>
            <input id="mb-email" type="email" placeholder="you@example.com" {...register("email")} />
          </div>
          <div className="field">
            <label htmlFor="mb-date">Date (optional)</label>
            <input
              id="mb-date"
              type="text"
              inputMode="numeric"
              placeholder="MM/DD/YYYY"
              {...register("date")}
              // Apply mask as user types; RHF keeps the value.
              onChange={(e) => setValue("date", maskDate(e.target.value))}
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Searching..." : "Search"}
          </button>
          {/* Quick reset: clear fields and results */}
          <button
            className="btn ghost"
            type="button"
            onClick={() => { setValue("email", ""); setValue("date", ""); setItems([]); }}
          >
            Reset
          </button>
        </div>
      </form>

      {/* Results list */}
      {items.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <ul className="details">
            {items.map((b) => (
              <li
                key={b.code}
                style={{ marginBottom: 10, borderBottom: "1px solid var(--stroke)", paddingBottom: 10 }}
              >
                <div><b>Code:</b> {b.code}</div>
                <div><b>Restaurant:</b> {restById.get(b.restaurant) || b.restaurant}</div>
                <div><b>Date/Time:</b> {isoToMMDDYYYY(b.date)} — {b.time}</div>
                <div><b>Guests:</b> {b.guests}</div>
                <div><b>Name:</b> {b.name} &nbsp; <b>Email:</b> {b.email}</div>

                {/* Row actions */}
                <div className="actions" style={{ marginTop: 8 }}>
                  <button className="btn" type="button" onClick={() => openReschedule(b)}>
                    Reschedule
                  </button>
                  <button className="btn ghost" type="button" onClick={() => cancelBooking(b.code)}>
                    Cancel booking
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state hint */}
      {items.length === 0 && (
        <p className="muted" style={{ marginTop: 8 }}>
          No results yet. Search by email (and optionally date).
        </p>
      )}

      {/* Reschedule modal (click backdrop to close) */}
      {editing && (
        <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="dialog">
            <h3 style={{ marginTop: 0 }}>Reschedule booking</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              {restById.get(editing.restaurant) || editing.restaurant} — current: {isoToMMDDYYYY(editing.date)} {editing.time}
            </p>

            {/* Error inside dialog (e.g., slot conflict) */}
            {dialogErr && (
              <div className="card" style={{ borderColor: "#ef4444aa", marginBottom: 10 }}>
                <strong>Error:</strong> {dialogErr}
              </div>
            )}

            {/* Date + time selectors inside dialog */}
            <div className="form" style={{ marginBottom: 8 }}>
              <div className="field">
                <label htmlFor="rs-date">New date</label>
                <input
                  id="rs-date"
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/DD/YYYY"
                  value={newDate}
                  onChange={async (e) => {
                    const v = maskDate(e.target.value);
                    setNewDate(v);
                    // Refresh slots for the newly typed date
                    await loadSlots(editing.restaurant, v);
                  }}
                />
              </div>

              <div className="field">
                <label htmlFor="rs-time">New time</label>
                <select
                  id="rs-time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                >
                  <option value="" disabled>Choose…</option>
                  {slots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dialog actions */}
            <div className="actions">
              <button className="btn" onClick={saveReschedule} disabled={saving || !newDate || !newTime}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="btn ghost" onClick={() => setEditing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
