# TableTime — Book tables the friendly way 🍽️

**TableTime** is a polished, production-style reservation flow you can drop into your app or use as a reference. It includes a type-ahead restaurant picker, smart date/time inputs with **live availability**, a delightful confirmation screen (.ics/Google Calendar), and a full **Manage bookings** section to search, cancel, and **reschedule**.

> Built with **React + Vite** and powered by a fully mocked backend using **MSW** — so you can run it anywhere with zero setup.

---

## Why you might love it

- 💡 **Realistic UX**: the flow mirrors common booking patterns users expect.
- ⚡ **Snappy dev experience**: MSW mocks the network at the Service Worker layer.
- 🧭 **Accessible by design**: labeled controls, keyboard navigation, helpful errors.
- 🌓 **Dark/Light theme**: instant toggle, persisted.
- 📅 **Calendars built-in**: export `.ics` and a direct **Google Calendar** link.

---

## Demo (screens)

- Booking form with availability popover  
  _[screenshot here]_

- Confirmation with add-to-calendar + share actions  
  _[screenshot here]_

- Manage bookings (search, cancel, reschedule)  
  _[screenshot here]_

---

## Features at a glance

- 🔍 Type-ahead **Restaurant** input with keyboard navigation  
- 📆 Strict **MM/DD/YYYY** date masking + native date picker  
- ⏱️ **Availability** per date & restaurant (17:00–22:00, 30-min steps)  
- ✅ Friendly validation via **React Hook Form**  
- 📝 “Remember my details” (localStorage)  
- 📤 **.ics** export + **Google Calendar** link  
- 🔁 **Reschedule** with conflict detection  
- 🗑️ Cancel booking  
- 🌓 Theming + subtle animations  

---

## Quick start

```bash
npm install
npm run dev
```

👉 http://localhost:5173

> The mock backend is auto-started in dev via MSW. No servers to configure.

---

## Tech

- React 18 + Vite
- React Hook Form
- Mock Service Worker (MSW)
- Vanilla CSS with theme tokens

---

## Project structure

```
public/
  back_day.jpg, back_night.jpg, restaurant-favicon.ico, site.webmanifest, mockServiceWorker.js
src/
  components/ (BookingForm, ManageBooking, ThemeToggle)
  mocks/ (browser.js, handlers.js)
  hooks/ (useTheme.js)
  assets/ (date/time icons)
  styles.css, App.jsx, main.jsx
```

---

## API (mocked)

- `GET /api/restaurants` → list of `{id,name}`
- `GET /api/availability?restaurant=<id>&date=<YYYY-MM-DD>` → `{ slots: ["17:00",...], capacityPerSlot }`
- `POST /api/bookings` → create booking (returns `code`)
- `GET /api/bookings?email=&date=` → list bookings
- `DELETE /api/bookings/:code` → cancel
- `PATCH /api/bookings/:code` → reschedule

Conflicts return **409** so you can test real-world edge cases.

---

## Roadmap

- Real backend (Prisma/Postgres or Firebase)
- Authenticated “My bookings”
- Multi-timezone handling
- i18n, alt date formats
- Cypress tests

---

## License

MIT. Use it, tweak it, ship it. If you build something cool with it, we’d love to hear! 💌
