# MPSC Pulse — *Pulse of MPSC*

A production-ready EdTech platform for MPSC aspirants: recorded lectures (YouTube unlisted),
PDF study material, backend-scored tests with deep analysis, XP / levels / streaks / badges,
leaderboards, global search, full Marathi + English UI, and a premium admin CMS.

---

## ⚠️ Stack note (please read)

The original brief asked for **React + Vite + Express + MongoDB**. The data layer now runs on
**MongoDB + Mongoose** as specified. The remaining difference is the runtime shell: this project
is built on **Next.js (App Router)** rather than a Vite dev server plus a separate Express process.

Everything else in the brief is delivered **exactly as specified**, and nothing about the product
design changed:

| Brief | Delivered here | Why it maps 1:1 |
|---|---|---|
| React (JavaScript, **no TypeScript**) | React 19, **all app code in `.js` / `.jsx`** | `tsconfig` runs with `allowJs`/`checkJs:false`; the data layer is plain `.js` too |
| Vite bundler | Next.js App Router (Turbopack) | Bundler-level swap only; zero component changes |
| Express `controllers/ routes/ services/ middleware/` | `src/server/**` + `src/app/api/**` | Same layering — route handler → service → model. **No business logic in React components.** |
| MongoDB + Mongoose models | **MongoDB + Mongoose** (`src/db/models.js`) | Delivered exactly as asked |
| React Router DOM | Next App Router (file-based) | Same URLs (`/home`, `/courses/:id`, `/admin/...`) |
| Axios, Lucide React, React Hook Form, Zod, Tailwind | **all used exactly as asked** | `src/services/api.js` is a real Axios instance with interceptors |

Porting back to Vite + Express is mechanical: `src/components`, `src/context`, `src/locales`,
`src/hooks`, `src/lib` and `src/services` move across untouched; `src/server/*` services become
Express controllers, and `src/db/models.js` is already a standard Mongoose model file that an
Express server can `require` as-is.

### Identifiers

Documents use **numeric auto-increment `_id`s** (served through a `counters` collection) rather
than `ObjectId`. Every model maps `_id` → `id` on the way out, so URLs stay `/courses/5` and all
foreign keys remain plain numbers.

---

## Quick start

```bash
npm install
# make sure MongoDB is running on mongodb://127.0.0.1:27017
npm run dev              # http://localhost:3000
```

Collections and indexes are created automatically by Mongoose on first connect —
there is no migration step.

The demo dataset (6 courses, 52 lectures, 26 PDFs, 5 tests, 16 users, audit log) seeds itself
automatically on the first request to `/api/health`, or via `POST /api/seed`.

### Demo student account

| Role | Login | Password |
|---|---|---|
| Student | `student@mpscpulse.in` | `Student@123` |

### Administrator

The administrator is **not** seeded with demo credentials and is never shown in the UI.
It is provisioned by `src/server/ensureAdmin.js` from environment variables, and the
password is bcrypt-hashed before it reaches MongoDB — the plaintext is never stored,
logged, or returned by any API.

Set the handle and password in `.env.local` (see below). The routine is idempotent: it
runs on login and on `/api/health`, creating the account if missing and re-hashing the
password if it changed, so rotating the password is just an env edit plus a restart.

Sign in with the **username**, not an email address.

### Environment

Create `.env.local` in the project root:

```env
DATABASE_URL=mongodb://127.0.0.1:27017/mpsc
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d

# Administrator sign-in (never rendered in the UI)
ADMIN_USERNAME=your-admin-handle
ADMIN_PASSWORD=your-strong-password
```

`DATABASE_URL` is the MongoDB connection string (a MongoDB Atlas `mongodb+srv://…`
URI works unchanged). `ADMIN_USERNAME` / `ADMIN_PASSWORD` fall back to the project
defaults when unset — **set them explicitly before deploying.**

No secret is ever imported into client code — only `NEXT_PUBLIC_*` reaches the browser.

---

## Architecture

```
src/
├─ app/                     # routes (App Router)
│  ├─ page.jsx              # Welcome
│  ├─ language/ terms-consent/
│  ├─ login/ register/ forgot-password/
│  ├─ terms/ privacy/ refund-policy/ copyright-policy/
│  ├─ (student)/            # ProtectedRoute group
│  │  ├─ home/ my-learning/ courses/[id]/ search/
│  │  ├─ lectures/[id]/ materials/[id]/
│  │  ├─ tests/[id]/ results/[id]/
│  │  └─ leaderboard/ profile/ settings/ notifications/
│  ├─ admin/                # AdminRoute group (12 screens + audit)
│  └─ api/                  # REST layer
├─ components/
│  ├─ ui/                   # design system (26 primitives)
│  ├─ cards/ charts/ layout/ admin/ legal/ guards/
├─ context/                 # I18n · Toast · Auth
├─ hooks/  services/  locales/{en,mr}/  lib/
├─ server/                  # auth · validation · gamification · services
└─ db/                      # Mongoose connection + models
```

### Design system

`Button · IconButton · Input · PasswordInput · Textarea · Select · Switch · Checkbox · Modal ·
Drawer · BottomSheet · ConfirmDialog · Card · CourseCard · LectureCard · QuizCard · PDFCard ·
ProgressBar · RingProgress · Badge · StatusBadge · PriceBadge · Avatar · Header · Sidebar ·
BottomNavigation · AdminSidebar · AdminHeader · Tabs · Chip · StatTile · Toast · Alert · Loader ·
Skeleton · EmptyState · ErrorState · DataTable · Pagination · charts`

Tokens (colour ramps, radii, shadows, typography) live in `src/app/globals.css` under Tailwind 4
`@theme`. Original brand: **Pulse Indigo** `#5b34e0` + coral accent — no third-party branding.

### Internationalisation

Zero hard-coded UI strings. `src/locales/en|mr/index.js` hold ~450 keys each;
`t("path.key")` for chrome and `tf(record, "title")` for bilingual content fields
(`title` / `titleMr`). Language is persisted locally **and** on the user record.

---

## Security model

| Concern | Implementation |
|---|---|
| Passwords | bcrypt (10 rounds); `passwordHash` is never projected into any API response |
| Auth | JWT (`sub` + `role`), 7-day expiry, Axios interceptor attaches the bearer token |
| Roles | `requireAuth` / `requireRole` / `requireAdmin` **re-read the role from Postgres** — client role claims are never trusted |
| Quiz scoring | 100% server-side; the paper endpoint never returns `correctIndex` or `explanation` |
| Duplicate submissions | 8-second replay window guard per (user, quiz) |
| XP | Awarded only by the backend from verified activity; unique index on `(userId, kind, refId)` makes replays worth **0 XP** |
| Course access | Enrolment + free/paid state resolved server-side on every lecture/PDF/quiz fetch |
| PDF downloads | When download is off, the button is hidden **and** the server returns no download URL. Screenshot prevention is documented as a deterrent only — never claimed as DRM |
| Policy versions | `termsVersion`/`privacyVersion`/`acceptedAt`/`language`/`platform` stored per user; server rejects mismatched versions and the app forces re-acceptance |
| Errors | Central `handler()` wrapper — validation issues surface as 422 field errors, internals never leak |

Verified by smoke test: student → `/api/admin/stats` returns **403**; XP replay returns **0**;
invalid YouTube URL returns **422**.

---

## Gamification

XP: lecture complete +10 · quiz attempt +5 · correct answer +10 · ≥80% +25 · 100% +50 ·
chapter +30 · course +150 · PDF +4 · daily streak +8 (all configurable in `src/lib/config.js`).

Levels: Beginner → Learner → Explorer → Scholar → Achiever → Master (thresholds configurable).

Leaderboards: all-time / weekly / monthly / course-wise, with **My Rank** and *XP needed for next
rank*. Ranking blends lecture completion, quiz performance, course completion and consistency —
never raw watch time.

Badges: First Lecture · 7 Day Streak · Quiz Master · Perfect Score · Bookworm · Course Completed ·
Top Learner.

---

## API surface

**Auth** `POST /api/auth/register · /login` · `GET|PATCH /api/auth/me` · `POST /api/auth/accept-policy`
**Catalog** `GET /api/courses` · `/api/courses/:id` · `/api/lectures/:id` · `/api/pdfs` · `/api/pdfs/:id` · `/api/quizzes` · `/api/quizzes/:id`
**Learning** `POST /api/progress` · `POST /api/quizzes/:id/attempt` · `GET /api/attempts/:id` · `POST /api/enrollments`
**Me** `GET /api/me/dashboard · /api/me/learning · /api/me/analytics`
**Discovery** `GET /api/search` (paging · filters · relevance · Marathi) · `/api/search/suggest`
**Social** `GET /api/leaderboard` · `/api/notifications`
**Admin** `GET|POST /api/admin/:entity` · `GET|PATCH|DELETE /api/admin/:entity/:id` ·
`POST /api/admin/:entity/bulk` · `GET /api/admin/stats · /analytics · /audit`
**Ops** `GET /api/health` · `POST /api/seed`

`:entity` ∈ `courses · subjects · chapters · lectures · pdfs · quizzes · students · notifications`.
One generic, audited CRUD engine (`src/server/services/adminEntities.js`) backs the whole CMS:
search, filters, sort, pagination, publish/unpublish, free↔paid, reorder, duplicate, cascade delete
and bulk actions.

---

## Admin CMS

Dashboard (6 KPI cards, growth line, engagement donut, test-performance bars, 5 activity lists) ·
Courses (multi-section form with live preview, pricing, validity, duplicate, course management hub) ·
Subjects · Chapters · Lectures (YouTube ID auto-extraction from any link format) ·
PDF Materials (URL + storage-key abstraction so object storage drops in later) ·
Quizzes (question builder, reorder, marks/negative marks, explanations, student-eye preview,
per-test analytics incl. hardest questions) · Students (progress, XP, deactivate/reactivate) ·
Leaderboard · Analytics · Notifications · Settings · **Activity Log** (admin · action · content · time).

A non-technical teacher can run the entire platform without touching the database.

---

## Responsive & accessibility

Mobile-first, verified at 320 / 375 / 390 / 412 / 768 / 1024 / 1440 px in both languages.
Mobile: bottom tab bar (Home · My Learning · Tests · Leaderboard · Profile) + drawer.
Desktop: persistent sidebar + header search. Safe-area insets, `dvh` heights, 44px touch targets,
`aria-*` on switches/checkboxes/dialogs/progress, visible focus rings, no text-overflow in Marathi.

---

## Android (Capacitor) — next step

The build is Capacitor-ready (standalone display, theme colour, safe-area utilities, manifest,
maskable icon). To ship:

```bash
npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
npx cap init "MPSC Pulse" in.mpscpulse.app
npx cap add android && npx cap sync
```

Point the Capacitor `server.url` at your deployed API host, then wire
`.github/workflows/android-build.yml` (checkout → node → install → build → test → cap sync → JDK →
Android SDK → APK → signed AAB → upload artifacts) using secrets
`KEYSTORE_BASE64 · KEYSTORE_PASSWORD · KEY_ALIAS · KEY_PASSWORD`. Never commit a keystore.

---

## Validation

```
npm run build           ✅  70 routes
/api/health             ✅  {"status":"ok","database":"connected","seeded":true}
API smoke suite         ✅  96/96 checks passing against MongoDB
```

Smoke-tested end to end: onboarding → language → consent → register/login → home → search (EN + मराठी)
→ course → lecture (+XP, streak, badge) → PDF gating → quiz → server-scored result → leaderboard →
profile; admin login → dashboard → create course/subject/chapter/YouTube lecture → publish →
free↔paid → duplicate → delete → audit log.
#   m p s c - p l u s  
 #   m p s c - p l u s  
 