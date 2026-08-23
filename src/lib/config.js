/* ============================================================
   MPSC Pulse — platform configuration
   Values here are the defaults; admin-editable settings are
   persisted in the `app_settings` table and override these.
   ============================================================ */

export const POLICY = {
  termsVersion: "1.3.0",
  privacyVersion: "1.3.0",
  refundVersion: "1.0.0",
  copyrightVersion: "1.0.0",
  updatedAt: "2026-08-23",
};

/** XP awarded per verified activity (backend-only source of truth). */
export const XP_RULES = {
  lecture_complete: 10,
  quiz_attempt: 5,
  quiz_correct_answer: 10,
  quiz_high_score_bonus: 25, // >= 80%
  quiz_perfect_bonus: 50,
  chapter_complete_bonus: 30,
  course_complete_bonus: 150,
  pdf_read: 4,
  streak_day_bonus: 8,
};

/** Level thresholds — configurable. */
export const LEVELS = [
  { key: "beginner", min: 0, max: 499 },
  { key: "learner", min: 500, max: 999 },
  { key: "explorer", min: 1000, max: 1999 },
  { key: "scholar", min: 2000, max: 2999 },
  { key: "achiever", min: 3000, max: 4999 },
  { key: "master", min: 5000, max: Infinity },
];

export function levelFor(xp = 0) {
  const x = Number(xp) || 0;
  const idx = LEVELS.findIndex((l) => x >= l.min && x <= l.max);
  const i = idx === -1 ? 0 : idx;
  const level = LEVELS[i];
  const next = LEVELS[i + 1] || null;
  const span = (next ? next.min : level.min + 1000) - level.min;
  const progress = Math.min(
    100,
    Math.round(((x - level.min) / (span || 1)) * 100),
  );
  return {
    key: level.key,
    number: i + 1,
    min: level.min,
    nextAt: next ? next.min : null,
    toNext: next ? Math.max(0, next.min - x) : 0,
    progress,
  };
}

export const BADGES = [
  { code: "first_lecture", icon: "PlayCircle", tone: "brand" },
  { code: "streak_7", icon: "Flame", tone: "accent" },
  { code: "quiz_master", icon: "Target", tone: "teal" },
  { code: "perfect_score", icon: "Sparkles", tone: "amber" },
  { code: "bookworm", icon: "BookOpen", tone: "brand" },
  { code: "course_completed", icon: "GraduationCap", tone: "teal" },
  { code: "top_learner", icon: "Trophy", tone: "amber" },
];

export const CATEGORIES = [
  "MPSC Rajyaseva",
  "Combined Group B",
  "Combined Group C",
  "PSI / STI / ASO",
  "Talathi",
  "Current Affairs",
  "Optional Subjects",
];

export const SUBJECT_POOL = [
  "Indian Polity",
  "Modern Indian History",
  "Geography of Maharashtra",
  "Indian Economy",
  "Environment & Ecology",
  "Science & Technology",
  "Marathi Grammar",
  "Current Affairs",
];

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "mr", label: "Marathi", native: "मराठी" },
];

export const APP_VERSION = "1.0.0";

export const ADMIN_NAV = [
  { key: "dashboard", href: "/admin", icon: "LayoutDashboard" },
  { key: "courses", href: "/admin/courses", icon: "GraduationCap" },
  { key: "subjects", href: "/admin/subjects", icon: "Library" },
  { key: "chapters", href: "/admin/chapters", icon: "ListTree" },
  { key: "lectures", href: "/admin/lectures", icon: "Video" },
  { key: "pdfs", href: "/admin/pdfs", icon: "FileText" },
  { key: "quizzes", href: "/admin/quizzes", icon: "ClipboardList" },
  { key: "students", href: "/admin/students", icon: "Users" },
  { key: "leaderboard", href: "/admin/leaderboard", icon: "Trophy" },
  { key: "analytics", href: "/admin/analytics", icon: "BarChart3" },
  { key: "notifications", href: "/admin/notifications", icon: "Bell" },
  { key: "settings", href: "/admin/settings", icon: "Settings" },
];

export const STUDENT_TABS = [
  { key: "home", href: "/home", icon: "Home" },
  { key: "myLearning", href: "/my-learning", icon: "BookMarked" },
  { key: "tests", href: "/tests", icon: "ClipboardCheck" },
  { key: "leaderboard", href: "/leaderboard", icon: "Trophy" },
  { key: "profile", href: "/profile", icon: "User" },
];
