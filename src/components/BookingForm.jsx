import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

// Light/Dark icons for the date and time addon buttons.
import calLight from "../assets/icon_cal_l.png";
import calDark from "../assets/icon_cal_d.png";
import clkLight from "../assets/icon_cloc_l.png";
import clkDark from "../assets/icon_cloc_d.png";

/* ────────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────────────── */

// Format a raw string into MM/DD/YYYY while the user types.
const maskDate = (v) => {
  const d = String(v || "").replace(/\D/g, "").slice(0, 8);
  const mm = d.slice(0, 2), dd = d.slice(2, 4), yyyy = d.slice(4, 8);
  return [mm, dd, yyyy].filter(Boolean).join("/");
};

// Convert "MM/DD/YYYY" to ISO "YYYY-MM-DD".
const toISO = (mmddyyyy) => {
  const s = String(mmddyyyy || "");
  const m = s.slice(0, 2), d = s.slice(3, 5), y = s.slice(6, 10);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

// Convert ISO "YYYY-MM-DD" to "MM/DD/YYYY".
const fromISOtoMMDDYYYY = (iso) => {
  if (!iso || typeof iso !== "string" || !iso.includes("-")) return iso ?? "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
};

// Case/diacritics-insensitive match (safe).
const norm = (s) => {
  const str = String(s ?? "");
  // normalize() может отсутствовать в очень старых вебвью — подстраховка
  const normalized = typeof str.normalize === "function" ? str.normalize("NFD") : str;
  return normalized.toLowerCase().replace(/[\u0300-\u036f]/g, "").trim();
};

// Parse "MM/DD/YYYY" into a Date (local).
const parseMMDDYYYY = (s) => {
  const src = String(s || "");
  const mm = Number(src.slice(0, 2));
  const dd = Number(src.slice(3, 5));
  const yyyy = Number(src.slice(6, 10));
  return new Date(yyyy, mm - 1, dd);
};

// Strip time to 00:00.
const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Local fallback restaurants list (in case API is not reachable).
const FALLBACK_FULL = [
  "Sea Breeze", "Urban Grill", "La Piazza", "Golden Dragon", "Garden Bistro", "Bluefin Sushi",
  "Rustic Oven", "Spice Route", "Emerald Steakhouse", "Cedar & Sage", "Copper Pot", "Sunset Terrace",
  "Harbor House", "Maple & Co.", "Cocoa Bean Cafe", "Lotus Garden", "Rio Cantina", "Falafel & Co.",
  "Olive Grove", "Truffle & Thyme", "Pier 27", "Red Lantern", "Midnight Diner", "Tandoori Flame",
  "Noodle Nook", "Pasta Fresca", "BBQ Junction", "Tapas & Tonic", "Pho Station", "Saffron Table",
  "Basilico", "Lemon & Lime", "Poke Planet", "Kebab Express", "Waffle Works", "Soup Society",
  "Burger Barn", "Avocado Bar", "Morning Glory", "The Pantry", "Chili & Lime", "Miso & More",
  "Curry Leaf", "Oyster Bar", "Meze House", "Cactus Grill", "Ramen Republic", "Mozzarella Lab",
  "Bread & Butter", "Vegan Vibes"
].map((name, i) => ({ id: String(i + 1), name }));
const FALLBACK_MIN = [{ id: "any", name: "Any" }];

/** Observe <html data-theme="..."> */
function useTheme() {
  const get = () => document.documentElement.getAttribute("data-theme") || "light";
  const [theme, setTheme] = useState(get);
  useEffect(() => {
    const el = document.documentElement;
    // В некоторых старых вебвью MutationObserver может отсутствовать
    if (typeof window.MutationObserver !== "function") return;
    const obs = new MutationObserver(() => setTheme(get()));
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

/** Build Google Calendar "dates" range (UTC) */
const toCalDT = (dateISO, time, plusMin = 90) => {
  const start = new Date(`${dateISO}T${time}:00`);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + plusMin);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  return { start: fmt(start), end: fmt(end) };
};

// crypto.randomUUID fallback for older engines
const safeUUID = () =>
  (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/* ────────────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────────────── */

export default function BookingForm() {
  const theme = useTheme();
  const calIcon = theme === "dark" ? calDark : calLight;
  const timeIcon = theme === "dark" ? clkDark : clkLight;

  const timeZone =
    (Intl?.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().timeZone) ||
    "Your local time";

  // today…+60d
  const MAX_DAYS = 60;
  const today = useMemo(() => stripTime(new Date()), []);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + MAX_DAYS);
    return d;
  }, [today]);

  const withinRange = (mmddyyyy) => {
    try {
      const d = stripTime(parseMMDDYYYY(mmddyyyy));
      return d >= today && d <= maxDate;
    } catch {
      return false;
    }
  };

  const {
    register,
    handleSubmit: submitRHF,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      restaurant: "",
      date: "",
      time: "",
      guests: 2,
      name: "",
      email: "",
      note: "",
    },
  });

  const [restaurants, setRestaurants] = useState([...FALLBACK_MIN, ...FALLBACK_FULL]);
  const [result, setResult] = useState(null);
  const [serverError, setServerError] = useState("");

  const [remember, setRemember] = useState(() => {
    const v = localStorage.getItem("tt-remember");
    return v === null ? true : v === "1";
  });

  const [restQuery, setRestQuery] = useState("");
  const [openSuggest, setOpenSuggest] = useState(false);
  const [hi, setHi] = useState(0);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [showTimePanel, setShowTimePanel] = useState(false);
  const [hiTime, setHiTime] = useState(0);

  const timePanelRef = useRef(null);
  const dateNativeRef = useRef(null);
  const timeRef = useRef(null);

  const openDatePicker = () => {
    const el = dateNativeRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  // Load restaurants (with one soft retry if SW/connection не успел подняться)
  useEffect(() => {
    let cancelled = false;
    const load = async (retry = false) => {
      try {
        const r = await fetch("/api/restaurants");
        if (!r.ok) throw new Error("not ok");
        const list = await r.json();
        if (!cancelled && Array.isArray(list) && list.length) setRestaurants(list);
      } catch {
        if (!retry) setTimeout(() => load(true), 400); // one retry
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Limit for native <input type="date">
  useEffect(() => {
    const el = dateNativeRef.current;
    if (!el) return;
    const toISODate = (d) => d.toISOString().slice(0, 10);
    el.min = toISODate(today);
    el.max = toISODate(maxDate);
  }, [today, maxDate]);

  // Prefill from localStorage
  useEffect(() => {
    try {
      const nm = localStorage.getItem("tt-name") || "";
      const em = localStorage.getItem("tt-email") || "";
      const rr = localStorage.getItem("tt-restaurant") || "";
      if (nm) setValue("name", nm);
      if (em) setValue("email", em);
      if (rr) {
        setRestQuery(rr);
        setValue("restaurant", rr, { shouldValidate: true });
      }
    } catch (e) {
      // если localStorage недоступен (privacy mode) — просто молча пропускаем
      console.warn("localStorage access skipped:", e);
    }
  }, [setValue]);

  const isValidRestaurant = (value) =>
    restaurants.some((r) => norm(r.name) === norm(value)) ||
    "Select a restaurant from the list";

  // Load available time slots when date & restaurant are valid
  const dateVal = watch("date");
  useEffect(() => {
    const picked = restaurants.find((r) => norm(r.name) === norm(restQuery));
    const validDate =
      /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/.test(String(dateVal || "")) &&
      withinRange(dateVal);

    if (!picked || !validDate) {
      setAvailableSlots([]);
      setShowTimePanel(false);
      return;
    }

    const iso = toISO(dateVal);
    fetch(`/api/availability?restaurant=${encodeURIComponent(picked.id)}&date=${iso}`)
      .then((r) => r.json())
      .then(({ slots }) => setAvailableSlots(Array.isArray(slots) ? slots : []))
      .catch(() => setAvailableSlots([]));
  }, [restQuery, dateVal, restaurants]);

  // Submit handler
  const onSubmit = async (data) => {
    setServerError("");
    setResult(null);
    try {
      const picked =
        restaurants.find((r) => norm(r.name) === norm(data.restaurant)) ||
        FALLBACK_MIN[0];

      // remember me
      try {
        localStorage.setItem("tt-remember", remember ? "1" : "0");
        if (remember) {
          localStorage.setItem("tt-name", data.name || "");
          localStorage.setItem("tt-email", data.email || "");
          localStorage.setItem("tt-restaurant", data.restaurant || "");
        } else {
          localStorage.removeItem("tt-name");
          localStorage.removeItem("tt-email");
          localStorage.removeItem("tt-restaurant");
        }
      } catch {
        /* ignore storage errors silently */
      }

      const payload = {
        ...data,
        restaurant: picked.id,
        date: toISO(data.date),
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const { message } = await res.json();
        setServerError(message || "Time slot conflict.");
        return;
      }
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({}));
        throw new Error(message || "Unknown server error");
      }

      const booking = await res.json();
      setResult({
        ...booking,
        displayDate: data.date,
        restaurantName: picked.name,
      });
    } catch (e) {
      setServerError(e.message || String(e));
    }
  };

  // ICS download
  const downloadICS = ({ title, location, description, dateISO, time, durationMin = 90 }) => {
    const start = `${dateISO.replace(/-/g, "")}T${time.replace(":", "")}00`;
    const endDate = new Date(`${dateISO}T${time}:00`);
    endDate.setMinutes(endDate.getMinutes() + durationMin);
    const end = endDate.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TableTime//EN",
      "BEGIN:VEVENT",
      `UID:${safeUUID()}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description || ""}`,
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "reservation.ics"; a.click();
    URL.revokeObjectURL(url);
  };

  // If a booking was just created — confirmation card
  if (result) {
    const gcal = (() => {
      const { start, end } = toCalDT(result.date, result.time, 90);
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: `TableTime — ${result.restaurantName}`,
        dates: `${start}/${end}`,
        details: `Reservation code: ${result.code}\nGuests: ${result.guests}\n${result.note || ""}`,
        location: result.restaurantName,
      });
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    })();

    return (
      <section className="card success">
        <h2>Booking Confirmed</h2>
        <p className="muted">Confirmation code: <strong>{result.code}</strong></p>
        <ul className="details">
          <li><b>Restaurant</b> — {result.restaurantName}</li>
          <li><b>Date</b> — {fromISOtoMMDDYYYY(result.date)}</li>
          <li><b>Time</b> — {result.time}</li>
          <li><b>Guests</b> — {result.guests}</li>
          <li><b>Name</b> — {result.name}</li>
          <li><b>Email</b> — {result.email}</li>
        </ul>
        {result.note && <p><b>Note:</b> {result.note}</p>}

        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() => downloadICS({
              title: "TableTime Reservation",
              location: result.restaurantName,
              description: `Reservation code: ${result.code}`,
              dateISO: result.date,
              time: result.time,
              durationMin: 90
            })}
          >
            Add to Calendar (.ics)
          </button>

          <a className="btn ghost" href={gcal} target="_blank" rel="noopener noreferrer">
            Add to Google Calendar
          </a>

          <button
            type="button"
            className="btn ghost"
            onClick={() => { navigator.clipboard?.writeText(result.code); }}
          >
            Copy code
          </button>

          <button
            type="button"
            className="btn ghost"
            onClick={() => window.print()}
          >
            Print
          </button>

          <button className="btn" onClick={() => { setResult(null); reset(); }}>
            Make another booking
          </button>
        </div>
      </section>
    );
  }

  // RHF validators/regs
  const restaurantReg = register("restaurant", { required: true, validate: isValidRestaurant });
  const dateReg = register("date", {
    required: "Use MM/DD/YYYY",
    validate: (v) =>
      (/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/.test(String(v)) && withinRange(v)) ||
      "Date out of range (today…+60d)"
  });
  const timeReg = register("time", {
    required: "Pick a time",
    validate: (v) =>
      availableSlots.length === 0 || availableSlots.includes(v) || "Pick an available time",
  });

  const filtered = restaurants.filter((r) => norm(r.name).includes(norm(restQuery)));

  useEffect(() => {
    if (showTimePanel && timePanelRef.current) {
      setHiTime(0);
      timePanelRef.current.focus();
    }
  }, [showTimePanel]);

  // Render form
  return (
    <section className="card">
      <h2>Book a table</h2>

      {!!serverError && (
        <div className="card" style={{ borderColor: "#ef4444aa", marginBottom: 12 }}>
          <strong>Error:</strong> {serverError}
        </div>
      )}

      <form className="form" onSubmit={submitRHF(onSubmit)} noValidate>
        <div className="grid">
          {/* Restaurant (combobox-like text input) */}
          <div className="field searchable">
            <label htmlFor="restaurant">Restaurant</label>
            <input
              id="restaurant"
              className="combo-input"
              placeholder="Choose or type to search…"
              {...restaurantReg}
              value={restQuery}
              aria-expanded={openSuggest ? "true" : "false"}
              aria-controls="restaurant-suggestions"
              onFocus={() => { setOpenSuggest(true); setHi(0); }}
              onChange={(e) => {
                restaurantReg.onChange(e);
                setRestQuery(e.target.value);
                setOpenSuggest(true);
                setHi(0);
              }}
              onKeyDown={(e) => {
                if (!openSuggest || filtered.length === 0) return;
                if (e.key === "ArrowDown") { e.preventDefault(); setHi((i) => Math.min(i + 1, filtered.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)); }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const pick = filtered[hi];
                  if (pick) {
                    setRestQuery(pick.name);
                    setValue("restaurant", pick.name, { shouldValidate: true });
                    setOpenSuggest(false);
                  }
                }
                if (e.key === "Escape") setOpenSuggest(false);
              }}
              onBlur={() => setTimeout(() => setOpenSuggest(false), 120)}
            />

            {openSuggest && (
              <div
                id="restaurant-suggestions"
                className="suggestions"
                role="listbox"
                aria-label="Restaurant suggestions"
              >
                {filtered.length ? (
                  <ul>
                    {filtered.map((r, i) => (
                      <li
                        key={r.id}
                        role="option"
                        aria-selected={i === hi ? "true" : "false"}
                        onMouseDown={() => {
                          setRestQuery(r.name);
                          setValue("restaurant", r.name, { shouldValidate: true });
                          setOpenSuggest(false);
                        }}
                        onMouseEnter={() => setHi(i)}
                      >
                        {r.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty">No matches</div>
                )}
              </div>
            )}

            {errors.restaurant && (
              <span className="err">{String(errors.restaurant.message || "Select from list")}</span>
            )}
          </div>

          {/* Guests */}
          <div className="field">
            <label htmlFor="guests">Guests</label>
            <select id="guests" {...register("guests", { valueAsNumber: true, min: 1, max: 10 })}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Date (masked) */}
          <div className="field with-addon">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="text"
              inputMode="numeric"
              placeholder="MM/DD/YYYY"
              {...dateReg}
              onChange={(e) => {
                const masked = maskDate(e.target.value);
                setValue("date", masked, { shouldValidate: true });
              }}
            />
            <input
              type="date"
              ref={dateNativeRef}
              className="visually-hidden-input"
              onChange={(e) => {
                const iso = e.target.value;
                if (!iso) return;
                const [y, m, d] = iso.split("-");
                const mmddyyyy = `${m}/${d}/${y}`;
                setValue("date", mmddyyyy, { shouldValidate: true, shouldDirty: true });
              }}
            />
            <button
              type="button"
              className="addon-btn"
              aria-label="Open date picker"
              title="Open date picker"
              onClick={openDatePicker}
            >
              <img src={calIcon} alt="" className="addon-icon" />
            </button>
            {errors.date && <span className="err">{errors.date.message}</span>}
            <p className="muted" style={{ marginTop: 6 }}>
              Available dates: today to +60 days.
            </p>
          </div>

          {/* Time + available slots popover */}
          <div className="field with-addon">
            <label htmlFor="time">Time</label>
            <input
              id="time"
              type="time"
              lang="en-US"
              {...timeReg}
              ref={(el) => { timeReg.ref(el); timeRef.current = el; }}
              onFocus={() => availableSlots.length && setShowTimePanel(true)}
              onBlur={() => setTimeout(() => setShowTimePanel(false), 120)}
            />
            <button
              type="button"
              className="addon-btn"
              aria-label="Open time options"
              title="Open time options"
              onClick={() => setShowTimePanel((v) => !v)}
            >
              <img src={timeIcon} alt="" className="addon-icon" />
            </button>

            <p className="muted" style={{ marginTop: 6 }}>
              {dateVal && restQuery && availableSlots.length > 0 &&
                `${availableSlots.length} slots available`}{" "}
              {dateVal && restQuery && availableSlots.length === 0 &&
                "No available slots for this date"}{" "}
              • Times shown in {timeZone}.
            </p>

            {showTimePanel && availableSlots.length > 0 && (
              <div
                className="popover"
                role="listbox"
                aria-label="Available time"
                tabIndex={-1}
                ref={timePanelRef}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setHiTime((i) => Math.min(i + 1, availableSlots.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setHiTime((i) => Math.max(i - 1, 0)); }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const t = availableSlots[hiTime];
                    if (t) {
                      setValue("time", t, { shouldValidate: true, shouldDirty: true });
                      setShowTimePanel(false);
                    }
                  }
                  if (e.key === "Escape") setShowTimePanel(false);
                }}
              >
                {availableSlots.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    className={`opt${i === hiTime ? " selected" : ""}`}
                    onMouseDown={() => {
                      setValue("time", t, { shouldValidate: true, shouldDirty: true });
                      setShowTimePanel(false);
                    }}
                    onMouseEnter={() => setHiTime(i)}
                    aria-selected={i === hiTime}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {errors.time && <span className="err">{errors.time.message}</span>}
          </div>

          {/* Name */}
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" type="text" placeholder="John Doe" {...register("name", { required: "Name is required" })} />
            {errors.name && <span className="err">{errors.name.message}</span>}
          </div>

          {/* Email */}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
              })}
            />
            {errors.email && <span className="err">{errors.email.message}</span>}
          </div>

          {/* Notes */}
          <div className="field span2">
            <label htmlFor="note">Notes (optional)</label>
            <textarea id="note" rows="4" placeholder="Allergic to nuts, window seat, etc." {...register("note")} />
          </div>

          {/* Remember-me */}
          <div className="field span2 checkbox">
            <label className="inline">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember my details on this device</span>
            </label>
          </div>
        </div>

        <div className="actions">
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Confirm booking"}
          </button>
          <button type="button" className="btn ghost" onClick={() => reset()}>
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}
