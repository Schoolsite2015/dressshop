# School OS — S.N Public School, Pindra, Varanasi

A real, modular school management platform: React/Vite/Tailwind frontend,
Node/Express/PostgreSQL backend, JWT auth, role-based dashboards, and an
AI Report Card Writer wired to the Anthropic API.

## What's actually working in Phase 1

The **database schema models every module** from the full vision (Student
Info System, Admissions, Fees, Timetable, Attendance, Exams, Report Cards,
Transport, Hostel, Library, Inventory, HR & Payroll, Notices/Events,
Certificates) — see `backend/src/db/schema.sql`.

**Built end-to-end (API + UI) so far:**
- Public school website (Home with a live Notice Board feed, About, Admissions with a real online-apply form, Gallery, Contact)
- Auth (JWT login, 5 demo role accounts)
- Student Information System (list/create students, classes, sections)
- Attendance (teacher marks it, student/parent see the %)
- Fees (office records payments, principal sees a collection chart, student/parent see their balance)
- Admissions pipeline (public apply + track, staff-side status pipeline)
- **AI Report Card Writer** — teacher enters marks/attendance/behaviour notes, Claude generates professional remarks, stored per student per exam
- **Gradebook** — create an exam, enter a students × subjects marks grid (feeds directly into the AI Report Card Writer)
- **Timetable** — Mon–Sat × 6-period view for every role, plus a real auto-generator endpoint (`POST /api/timetable/generate`) that fills the week without double-booking any teacher across classes
- **Homework** — teachers post by class/section, students/parents see it
- **Notice Board** — office/principal post circulars; shown on the staff dashboards *and* live on the public homepage

**Scaffolded (DB tables exist, sidebar shows "coming soon"):** Transport +
live bus tracking (Socket.IO room logic is already in
`backend/src/index.js`, just needs a driver app/device to emit
locations), Library, Hostel, Inventory, HR & Payroll, Certificates, AI
Lesson Planner, AI Question Paper Generator, AI Tutor.

Each scaffolded module follows the exact same pattern as the built ones
(schema → controller → route → page), so extending this is additive work,
not a rewrite.

## Running it locally

Requires Node.js 18+ and either Docker or a local PostgreSQL install.

```bash
# 1. Start PostgreSQL (or point DATABASE_URL at your own instance)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env        # then fill in JWT_SECRET and ANTHROPIC_API_KEY
npm install
npm run migrate             # creates all tables from schema.sql
npm run seed                # sample classes, subjects, demo users
npm run dev                 # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Demo logins (after `npm run seed`), password for all: `Password@123`
- principal@snpublicschool.edu.in
- teacher@snpublicschool.edu.in
- student@snpublicschool.edu.in
- parent@snpublicschool.edu.in
- office@snpublicschool.edu.in

## Project structure

```
school-os/
  backend/
    src/
      config/       # DB pool
      middleware/    # JWT auth, role guards
      controllers/   # business logic per module
      routes/        # Express routers per module
      db/            # schema.sql, seed.sql, migrate.js, seed.js
      index.js        # app entry, mounts all routes + Socket.IO
  frontend/
    src/
      pages/public/          # marketing site
      pages/auth/            # login
      pages/dashboards/      # principal, teacher, student, parent, office
      components/            # Sidebar (role-based module nav), shell, etc.
      store/authStore.js     # zustand, persisted JWT
      lib/api.js             # axios client with auth interceptor
  docker-compose.yml   # local Postgres
```

## Suggested build order for the rest of the vision

1. **Timetable generator UI polish** — the endpoint is complete and
   conflict-safe; add a subject/teacher picker in `Timetable.jsx`'s
   `GeneratorPanel` so principals don't have to call the API directly.
2. **Transport live tracking** — Socket.IO plumbing exists; needs a
   driver-side app or a GPS device webhook emitting `bus:location`.
3. **AI Lesson Planner + Question Paper Generator** — same pattern as the
   AI Report Card Writer (`backend/src/controllers/ai.controller.js`):
   add a route, prompt Claude, store the result.
4. **Library, Hostel, Inventory, HR & Payroll, Certificates** — all
   straightforward CRUD against tables that already exist in
   `schema.sql`; good candidates to build in parallel once the
   controller → route → page pattern is familiar.

## Notes on going further

- This is a genuine starting point, not a finished commercial product.
  Before any school uses it with real student data: add row-level
  authorization checks (a parent should only see *their own* child — the
  parent/student dashboards currently demo against the first seeded
  record and need the real `parent_user_id` / session lookup wired in),
  input validation (`zod` is already a dependency, not yet applied to
  every route), rate limiting, HTTPS, and a proper backup strategy for
  PostgreSQL.
- Multi-school / multi-campus support, audit logs, and granular role
  permissions are realistic Phase 3 additions once one school is live on
  this.
