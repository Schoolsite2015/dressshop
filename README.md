# S.N. Uniform Shop — Billing & Inventory System

A full-stack POS + inventory management system for school uniform shops, built to the spec:
dashboard, stock management with per-size low/out-of-stock alerts, billing with auto stock
deduction, printable bills, sales/profit/best-seller reports, customer history, supplier
purchase history, unified search, admin panel (users + manual backup), and a nightly
automatic backup job.

**Now supports multiple schools/shops from one install.** Each school has its own login
accounts, its own stock/customers/bills/suppliers, and its own name, address, and logo shown
in the sidebar and on printed bills. One school's staff can never see another school's data —
everything is scoped behind the logged-in user's school automatically.

## Tech Stack

- **Backend:** Node.js + Express, SQLite (via Node's built-in `node:sqlite` — no native
  compilation required), JWT auth, bcrypt password hashing.
- **Frontend:** React (Vite) + Tailwind CSS v4, React Router.

> Note on the database: the spec suggested PostgreSQL/MySQL. This build uses SQLite instead
> because it needs zero setup (single file, no separate DB server). Every school's data lives
> in the same file, tagged with a `school_id` column on each table — simpler and less brittle
> than juggling one database file per school, with the same end result of full data isolation.

## Requirements

- Node.js **v22.5 or newer** (needed for the built-in `node:sqlite` module). Check yours with:
  ```bash
  node -v
  ```
  If it's lower than v22.5.0 (e.g. v18.x, v20.x, or v22.0–22.4), the backend will refuse to
  start and print a clear message telling you to upgrade — install a newer version from
  https://nodejs.org, or with nvm: `nvm install 22 && nvm use 22`.

## If nothing seems to work

Do a clean install rather than reusing an older copy of this project — mixing an old
`frontend/` with a new `backend/` (or vice versa) will break things in confusing ways. From
scratch:

```bash
# from the unzipped project root
rm -rf backend/node_modules backend/data backend/package-lock.json
rm -rf frontend/node_modules frontend/dist frontend/package-lock.json

cd backend && npm install && npm run seed && npm start
# in a second terminal:
cd frontend && npm install && npm run dev
```

Then open http://localhost:5173 — **not** http://localhost:4000 (that's the API only, it has
no UI). Both terminals need to stay running at the same time.

If it still doesn't work, the exact error message matters a lot — whatever appears in either
terminal, or in the browser's developer console (F12 → Console tab), tells us exactly where
it's breaking.

## 1. Backend setup

```bash
cd backend
npm install
npm run seed     # creates the database, both seeded schools, their users, and sample stock
npm start        # runs on http://localhost:4000
```

Default logins created by the seed script:

| School                              | Username     | Password         | Role  |
|--------------------------------------|--------------|-------------------|-------|
| S.N. Uniform Shop                    | admin        | admin123          | admin |
| S.N. Uniform Shop                    | staff        | staff123          | staff |
| Chandrabhan International Academy    | chandrabhan  | chandrabhan@123   | admin |
| Chandrabhan International Academy    | cb_staff     | staff123          | staff |

**Change these passwords before real use** (Admin Panel → Users, or re-seed with your own).
Logging in with any of these usernames automatically opens that school's own panel — its own
name, address, and logo in the sidebar, its own stock, bills, and customers.

### Adding another school

Open `backend/src/db/seed.js` and add another block like the Chandrabhan one near the bottom:

```js
const school3 = ensureSchool({
  name: 'Your School Name',
  address: 'Full address',
  phone: '+91-...',
  email: 'contact@example.com',
  logoPath: '/logos/logo_yourschool.png', // put the file in backend/public/logos/
});
ensureUser({ schoolId: school3.id, username: 'yourschool_admin', password: 'choose-a-password', role: 'admin' });
seedCatalogIfEmpty(school3.id, 'Your School Name');
```

Drop the logo file into `backend/public/logos/`, then run `npm run seed` again — it only
adds what's missing, so it's safe to re-run any time. (You can also add schools directly via
SQL/DB tooling without touching the seed script, if you'd rather not restart the server.)

Environment variables (optional, create `backend/.env`):

```
PORT=4000
JWT_SECRET=replace-with-a-long-random-string
DB_PATH=./data/shop.db
```

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev      # runs on http://localhost:5173, proxies /api and /logos to the backend
```

Open http://localhost:5173 and log in with any of the accounts above — the sidebar, header,
and printed bills will automatically show that school's own name, address, and logo.

For production, build the static frontend and serve it from any static host or from the
backend itself:

```bash
cd frontend
npm run build    # outputs to frontend/dist
```

## Feature notes

- **Stock:** "Add Stock" creates the item if it doesn't exist yet, or tops up the existing
  size's stock and logs a purchase record automatically. Scoped to the logged-in school.
  Every size automatically gets a unique barcode (`SKU########`) the moment it's created —
  click "Barcode" on any stock tile to see and print a scannable QR tag for it.
- **Billing:** searching by phone loads a returning customer's saved details (scoped to their
  own school). Generating a bill decrements stock automatically and is wrapped in a database
  transaction, so a bill either fully succeeds or fully fails. Bill numbers restart from 1 per
  school.
  - **Barcode scanning:** the barcode field in Billing accepts input from any USB barcode
    scanner (they act as a keyboard, "typing" the code + Enter — no special driver needed) or
    from typing a code by hand. There's also a camera-based scan button, which uses the
    browser's built-in `BarcodeDetector` (works in Chrome/Edge; on browsers without it, you'll
    get a clear message to use the USB scanner or manual entry instead).
  - **WhatsApp / SMS sharing:** after generating a bill, "Share via WhatsApp" opens
    WhatsApp Web/App with the bill text pre-filled to the customer's number (via the free
    `wa.me` link — no API keys or business account needed), and "Share via SMS" opens the
    phone's messaging app the same way. If you later want fully automated sending (no tap
    required) you'd need a paid provider like Twilio or the WhatsApp Business API — that's a
    separate integration this doesn't include.
- **Returns & exchanges:** the Returns page looks up any bill by number, shows how much of
  each line is still returnable (accounting for partial returns already processed), restores
  stock automatically, and records a refund. An **exchange** is a return of the old item
  followed by a normal new bill for the replacement item — process the return first, then use
  the "Bill Exchange Items" shortcut to jump straight to Billing. Returns are netted out of
  the sales, profit, and best-seller reports so refunded items don't inflate the numbers.
- **Suppliers:** full CRUD (list, add, edit, delete) plus a detail view per supplier showing
  their complete purchase history and total spend. Deleting a supplier keeps past purchase
  records intact (it just detaches the supplier reference) rather than deleting history.
- **Admin:** an admin only ever sees and manages users within their own school. Deleting a
  bill (not yet exposed in the UI, but available at `DELETE /api/bills/:id`) restores the
  stock it consumed.
- **Backup:** runs automatically every night at 2 AM to `backend/data/backups/`, and can also
  be triggered manually from the Admin Panel. One backup file covers every school (they all
  share the one database file).

## Not yet built (from your "features I'd add" list)

- Sibling discount coupons
- A super-admin screen for adding schools through the UI instead of editing `seed.js`
- Fully automated WhatsApp/SMS sending via a paid provider (Twilio, WhatsApp Business API) —
  the current version uses free share links that need one tap to send

## Deploying to a VPS

1. Copy the `backend/` folder to your server, run `npm install --production`, `npm run seed`
   once, then run it under a process manager like `pm2` (`pm2 start src/server.js --name dress-shop-api`).
2. Build the frontend (`npm run build`) and serve `frontend/dist` with any static file server
   or Nginx, proxying `/api` and `/logos` to the backend port.
3. Put Nginx (or Caddy) in front for HTTPS.
4. Set a strong `JWT_SECRET` in `backend/.env` on the server.

