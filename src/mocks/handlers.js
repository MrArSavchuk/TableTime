// src/mocks/handlers.js
// Mock Service Worker route handlers for the TableTime demo.
// All data is kept in-memory (process lifetime), so each dev-server restart clears it.

import { http, HttpResponse, delay } from "msw";

/* ────────────────
   Static directory of restaurant names
   ──────────────── */
const baseNames = [
  "Sea Breeze", "Urban Grill", "La Piazza", "Golden Dragon", "Garden Bistro", "Bluefin Sushi",
  "Rustic Oven", "Spice Route", "Emerald Steakhouse", "Cedar & Sage", "Copper Pot", "Sunset Terrace",
  "Harbor House", "Maple & Co.", "Cocoa Bean Cafe", "Lotus Garden", "Rio Cantina", "Falafel & Co.",
  "Olive Grove", "Truffle & Thyme", "Pier 27", "Red Lantern", "Midnight Diner", "Tandoori Flame",
  "Noodle Nook", "Pasta Fresca", "BBQ Junction", "Tapas & Tonic", "Pho Station", "Saffron Table",
  "Basilico", "Lemon & Lime", "Poke Planet", "Kebab Express", "Waffle Works", "Soup Society",
  "Burger Barn", "Avocado Bar", "Morning Glory", "The Pantry", "Chili & Lime", "Miso & More",
  "Curry Leaf", "Oyster Bar", "Meze House", "Cactus Grill", "Ramen Republic", "Mozzarella Lab",
  "Bread & Butter", "Vegan Vibes"
];

/** Create URL-friendly ids from names ("La Piazza" → "la-piazza") */
const slug = (s) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Public list returned by /api/restaurants */
export const restaurants = [
  { id: "any", name: "Any" },
  ...baseNames.map((name) => ({ id: slug(name), name })),
];

/* ────────────────
   In-memory "database"
   ──────────────── */
const bookings = []; // each item: {restaurant, date (YYYY-MM-DD), time (HH:mm), guests, name, email, note, code}
const randomCode = () => "TT-" + Math.random().toString(36).slice(2, 7).toUpperCase();

/* ────────────────
   Handlers
   ──────────────── */
export const handlers = [
  // Health-check: quick ping used in dev occasionally
  http.get("/api/health", async () => {
    await delay(200);
    return HttpResponse.json({ ok: true });
  }),

  // List of restaurants
  http.get("/api/restaurants", async () => {
    await delay(300);
    return HttpResponse.json(restaurants);
  }),

  // Available time slots for a given restaurant & date
  // Query: ?restaurant=<id>&date=<YYYY-MM-DD>
  http.get("/api/availability", async ({ request }) => {
    await delay(250);

    const url = new URL(request.url);
    const restId = url.searchParams.get("restaurant");
    const dateISO = url.searchParams.get("date"); // YYYY-MM-DD

    // Build half-hour slots from 17:00 to 22:00
    const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const toStr = (mins) =>
      String(Math.floor(mins / 60)).padStart(2, "0") + ":" + String(mins % 60).padStart(2, "0");

    const all = [];
    for (let m = toMin("17:00"); m <= toMin("22:00"); m += 30) all.push(toStr(m));

    // Exclude already booked times for same restaurant+date
    const busy = new Set(
      bookings
        .filter((b) => b.restaurant === restId && b.date === dateISO)
        .map((b) => b.time)
    );

    const free = all.filter((t) => !busy.has(t));
    return HttpResponse.json({ slots: free, capacityPerSlot: 10 });
  }),

  // Create a booking
  http.post("/api/bookings", async ({ request }) => {
    await delay(800);

    // 8% random server error (to exercise client error handling)
    if (Math.random() < 0.08) {
      return HttpResponse.json(
        { message: "Temporary server error. Please try again." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { restaurant, date, time, guests, name, email, note } = body || {};

    // Basic validation
    if (!date || !time || !name || !email) {
      return HttpResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // Conflict: same restaurant+date+time already taken
    const conflict = bookings.find(
      (b) => b.restaurant === restaurant && b.date === date && b.time === time
    );
    if (conflict) {
      return HttpResponse.json(
        { message: "Selected time slot is no longer available." },
        { status: 409 }
      );
    }

    // Persist
    const booking = { restaurant, date, time, guests, name, email, note, code: randomCode() };
    bookings.push(booking);

    return HttpResponse.json(booking, { status: 201 });
  }),

  // Search bookings (by email and/or date)
  // Query: ?email=<email>&date=<YYYY-MM-DD>
  http.get("/api/bookings", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const email = url.searchParams.get("email");

    let list = bookings.slice();
    if (date) list = list.filter((b) => b.date === date);
    if (email) list = list.filter((b) => b.email.toLowerCase() === email.toLowerCase());

    return HttpResponse.json(list);
  }),

  // Cancel booking by code
  http.delete("/api/bookings/:code", async ({ params }) => {
    await delay(300);
    const { code } = params;
    const idx = bookings.findIndex((b) => b.code === code);
    if (idx === -1) {
      return HttpResponse.json({ message: "Booking not found" }, { status: 404 });
    }
    bookings.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Reschedule booking (change date/time)
  http.patch("/api/bookings/:code", async ({ params, request }) => {
    await delay(300);
    const { code } = params;
    const body = await request.json().catch(() => ({}));
    const { date, time } = body || {};

    const i = bookings.findIndex((b) => b.code === code);
    if (i === -1) {
      return HttpResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    if (!date || !time) {
      return HttpResponse.json({ message: "Missing date/time" }, { status: 400 });
    }

    // Prevent double-booking the new slot for same restaurant
    const { restaurant } = bookings[i];
    const conflict = bookings.some(
      (b) => b.restaurant === restaurant && b.date === date && b.time === time && b.code !== code
    );
    if (conflict) {
      return HttpResponse.json(
        { message: "Selected time slot is no longer available." },
        { status: 409 }
      );
    }

    bookings[i] = { ...bookings[i], date, time };
    return HttpResponse.json(bookings[i]);
  }),
];
