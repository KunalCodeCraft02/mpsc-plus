# MPSC Pulse

> **Pulse of MPSC** - a production-ready EdTech platform for MPSC aspirants.

MPSC Pulse brings recorded lectures, PDF study material, server-scored tests, progress
tracking, gamification, leaderboards, global search, Marathi and English support, and a
full-featured admin CMS into one responsive application.

## Features

- Recorded lectures using unlisted YouTube videos
- PDF materials with free and paid access controls
- Server-side quiz scoring with explanations and detailed results
- XP, levels, streaks, badges, course progress, and leaderboards
- Marathi and English interface with bilingual content fields
- Student dashboard, learning history, notifications, and search
- Admin CMS for courses, subjects, chapters, lectures, PDFs, quizzes, students, and audit logs
- Mobile-first responsive UI with accessible controls and safe-area support

## Technology

| Area | Implementation |
| --- | --- |
| UI | React 19 with JavaScript and JSX |
| Framework | Next.js 16 App Router with Turbopack |
| Styling | Tailwind CSS 4 and custom design tokens |
| Database | MongoDB with Mongoose |
| Authentication | JWT with bcrypt password hashing |
| Forms and validation | React Hook Form and Zod |
| HTTP client | Axios with authentication interceptors |
| Icons | Lucide React |

The original brief specified Vite and Express. This implementation uses the Next.js App Router;
the API routes in `src/app/api` provide the server layer, while shared services remain separated
from React components.

## Quick Start

### Requirements

- Node.js 20 or newer
- MongoDB running locally or a MongoDB Atlas database

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Collections and indexes are created automatically by Mongoose on the first database connection.
The demo dataset seeds on the first request to `/api/health`, or through `POST /api/seed`.

### Demo student account

| Role | Login | Password |
| --- | --- | --- |
| Student | `student@mpscpulse.in` | `Student@123` |

## Environment Variables

Create `.env.local` in the project root for local development:

```env
DATABASE_URL=mongodb://127.0.0.1:27017/mpsc
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d

# Administrator sign-in
ADMIN_USERNAME=your-admin-handle
ADMIN_PASSWORD=your-strong-password
ADMIN_NAME=MPSC Pulse Admin
ADMIN_MOBILE=9800000001
```

`MONGODB_URI` can be used instead of `DATABASE_URL`. MongoDB Atlas `mongodb+srv://` URLs are
supported. Set explicit, strong administrator credentials before deploying. Never commit
`.env.local` or production secrets.

## Deploying to Vercel

This project is ready to build on Vercel with the default Next.js settings:

```bash
npm run build
```

Add these variables in the Vercel project settings:

- `DATABASE_URL` or `MONGODB_URI`
- `JWT_SECRET` or `AUTH_SECRET`
- `JWT_EXPIRES_IN` (optional; defaults to `7d`)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_NAME` (optional)
- `ADMIN_MOBILE` (optional)

The MongoDB deployment must allow connections from Vercel. After deployment, verify
`/api/health` and confirm it reports a connected database.

## Project Structure

```text
src/
├── app/                 # Pages, layouts, and API route handlers
├── components/          # Shared UI, cards, charts, shells, and admin tools
├── context/             # Authentication, language, app providers, and toasts
├── db/                  # MongoDB connection and Mongoose models
├── hooks/               # Reusable React hooks
├── lib/                 # Configuration and shared utilities
├── locales/             # English and Marathi translations
├── server/              # Authentication, validation, gamification, and services
└── services/            # Client-side API service
```

## API Overview

| Area | Example endpoints |
| --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Catalog | `GET /api/courses`, `GET /api/lectures/:id`, `GET /api/pdfs` |
| Learning | `POST /api/progress`, `POST /api/enrollments`, `POST /api/quizzes/:id/attempt` |
| Student | `GET /api/me/dashboard`, `GET /api/me/learning`, `GET /api/leaderboard` |
| Search | `GET /api/search`, `GET /api/search/suggest` |
| Admin | `/api/admin/:entity`, `/api/admin/stats`, `/api/admin/analytics` |
| Operations | `GET /api/health`, `POST /api/seed` |

## Security

- Passwords are hashed with bcrypt and password hashes are never returned by APIs.
- JWT authentication uses a seven-day expiry by default.
- Roles are re-read from MongoDB on protected requests; client claims are not trusted.
- Quiz answers and scoring remain on the server.
- Enrollment and free/paid access are checked on every protected content request.
- Policy versions and consent metadata are stored per user.
- Validation errors return structured 422 responses without exposing internal errors.

## Validation

```bash
npm run build
npm run lint
npm run typecheck
```

The production build currently generates 70 routes successfully.

## Android

The app is prepared for a future Capacitor wrapper. The Android project can be added with:

```bash
npm install -D @capacitor/cli
npm install @capacitor/core @capacitor/android
npx cap init "MPSC Pulse" in.mpscpulse.app
npx cap add android
npx cap sync
```

Never commit Android keystores or signing credentials.
