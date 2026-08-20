import { mongoose } from "./connect";

const { Schema, model, models } = mongoose;

/* ------------------------------------------------------------------ */
/* Numeric auto-increment ids                                          */
/* ------------------------------------------------------------------ */
/**
 * The original schema used Postgres `serial` primary keys, and ids appear in
 * URLs (/courses/5), JWT `sub` claims and every foreign key. Keeping numeric
 * ids (instead of ObjectId) means routes and client code stay unchanged.
 */
const counterSchema = new Schema(
  { _id: String, seq: { type: Number, default: 0 } },
  { versionKey: false },
);
export const Counter = models.Counter || model("Counter", counterSchema, "counters");

/** Reserve a block of ids; returns the LAST id of the block. */
export async function nextId(name, count = 1) {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: count } },
    { returnDocument: "after", upsert: true },
  ).lean();
  return doc.seq;
}

/** Shape a lean/aggregate result like the old SQL row: `_id` -> `id`, no `__v`. */
export function ser(input) {
  if (input == null) return input;
  if (Array.isArray(input)) return input.map(ser);
  if (typeof input !== "object" || input instanceof Date) return input;
  // A Mongoose document keeps its fields in an internal `_doc`, so spreading one
  // yields `{ $__, _doc }` and every field reads as undefined. Callers must pass
  // a lean/plain object; converting here stops a missed `.toObject()` from
  // silently turning a real record into a blank one.
  if (typeof input.toObject === "function") input = input.toObject();
  const { _id, __v, ...rest } = input;
  return _id === undefined ? rest : { id: _id, ...rest };
}

const baseOpts = {
  versionKey: false,
  timestamps: false,
  toJSON: {
    virtuals: false,
    transform(_doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};

/** Build a schema with a numeric `_id` auto-assigned on save/insertMany. */
function autoIncSchema(name, definition, indexes = []) {
  const schema = new Schema({ _id: Number, ...definition }, baseOpts);

  // Mongoose 9 does not pass `next` to async middleware — these must not call it.
  schema.pre("save", async function assignId() {
    if (this.isNew && this._id == null) this._id = await nextId(name);
  });

  schema.pre("insertMany", async function assignIds(docs) {
    const missing = docs.filter((d) => d._id == null);
    if (missing.length) {
      const last = await nextId(name, missing.length);
      const start = last - missing.length + 1;
      missing.forEach((d, i) => {
        d._id = start + i;
      });
    }
  });

  for (const [fields, opts] of indexes) schema.index(fields, opts);
  return schema;
}

const compile = (name, schema, collection) =>
  models[name] || model(name, schema, collection);

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */
const userSchema = autoIncSchema(
  "users",
  {
    name: { type: String, required: true, maxlength: 160 },
    email: { type: String, required: true, maxlength: 190 },
    mobile: { type: String, required: true, maxlength: 20 },
    /**
     * Optional login handle. Staff sign in with this instead of an email.
     * Deliberately has no default: students must not carry a `username: null`,
     * which a unique index would treat as a real value and reject on the
     * second such account.
     */
    username: { type: String, maxlength: 60 },
    passwordHash: { type: String, required: false, default: null },
    role: { type: String, required: true, default: "STUDENT" },
    language: { type: String, required: true, default: "en" },
    avatarUrl: { type: String, default: null },
    status: { type: String, required: true, default: "ACTIVE" },
    xp: { type: Number, required: true, default: 0 },
    streakCurrent: { type: Number, required: true, default: 0 },
    streakLongest: { type: Number, required: true, default: 0 },
    lastStudyDate: { type: String, default: null },
    termsVersion: { type: String, default: null },
    privacyVersion: { type: String, default: null },
    acceptedAt: { type: Date, default: null },
    platform: { type: String, default: "web" },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  [
    [{ email: 1 }, { unique: true, name: "users_email_uq" }],
    [{ mobile: 1 }, { unique: true, name: "users_mobile_uq" }],
    // Partial, not sparse: uniqueness applies only to documents where username
    // is an actual string, so any number of accounts may omit it (or hold null).
    [
      { username: 1 },
      {
        unique: true,
        name: "users_username_uq",
        partialFilterExpression: { username: { $type: "string" } },
      },
    ],
    [{ xp: -1 }, { name: "users_xp_idx" }],
  ],
);
export const User = compile("User", userSchema, "users");

/* ------------------------------------------------------------------ */
/* Email OTP (signup + password reset verification)                    */
/* ------------------------------------------------------------------ */
/**
 * Short-lived verification codes. Only a bcrypt hash of the code is stored —
 * never the digits themselves — and the TTL index makes MongoDB purge the
 * document once it expires, so nothing is retained permanently. `payload`
 * holds the pending signup profile (with an already-bcrypt-hashed password)
 * until the code is verified; no `users` document exists before that.
 */
/**
 * Plain ObjectId `_id`, deliberately NOT autoIncSchema: these ids never appear
 * in a URL, a JWT or a foreign key, and the numeric id is only assigned by a
 * pre("save") hook — which an upsert bypasses, leaving MongoDB to generate an
 * ObjectId that then fails to cast against a declared Number `_id`.
 */
const emailOtpSchema = new Schema(
  {
    email: { type: String, required: true, maxlength: 190 },
    purpose: { type: String, required: true, default: "REGISTER" },
    codeHash: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: null },
    attempts: { type: Number, required: true, default: 0 },
    sendCount: { type: Number, required: true, default: 1 },
    windowStartedAt: { type: Date, required: true, default: Date.now },
    lastSentAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false },
);
// One live code per address + purpose: issuing a new one overwrites (and
// therefore invalidates) the previous code.
emailOtpSchema.index({ email: 1, purpose: 1 }, { unique: true, name: "email_otps_uq" });
// TTL — MongoDB deletes the document at `expiresAt`.
emailOtpSchema.index({ expiresAt: 1 }, { name: "email_otps_ttl_idx", expireAfterSeconds: 0 });

export const EmailOtp = compile("EmailOtp", emailOtpSchema, "email_otps");

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */
const courseSchema = autoIncSchema(
  "courses",
  {
    title: { type: String, required: true, maxlength: 200 },
    titleMr: { type: String, default: null },
    slug: { type: String, required: true, maxlength: 220 },
    description: { type: String, default: null },
    descriptionMr: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    instructor: { type: String, default: null },
    category: { type: String, default: null },
    language: { type: String, default: "Marathi" },
    isFree: { type: Boolean, required: true, default: true },
    price: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "INR" },
    validityDays: { type: Number, default: 365 },
    published: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  [
    [{ slug: 1 }, { unique: true, name: "courses_slug_uq" }],
    [{ published: 1 }, { name: "courses_pub_idx" }],
  ],
);
export const Course = compile("Course", courseSchema, "courses");

const subjectSchema = autoIncSchema(
  "subjects",
  {
    courseId: { type: Number, required: true },
    name: { type: String, required: true, maxlength: 200 },
    nameMr: { type: String, default: null },
    description: { type: String, default: null },
    orderIndex: { type: Number, required: true, default: 1 },
  },
  [[{ courseId: 1 }, { name: "subjects_course_idx" }]],
);
export const Subject = compile("Subject", subjectSchema, "subjects");

const chapterSchema = autoIncSchema(
  "chapters",
  {
    courseId: { type: Number, required: true },
    subjectId: { type: Number, required: true },
    title: { type: String, required: true, maxlength: 200 },
    titleMr: { type: String, default: null },
    description: { type: String, default: null },
    orderIndex: { type: Number, required: true, default: 1 },
  },
  [[{ subjectId: 1 }, { name: "chapters_subject_idx" }]],
);
export const Chapter = compile("Chapter", chapterSchema, "chapters");

const lectureSchema = autoIncSchema(
  "lectures",
  {
    courseId: { type: Number, required: true },
    subjectId: { type: Number, default: null },
    chapterId: { type: Number, default: null },
    title: { type: String, required: true, maxlength: 220 },
    titleMr: { type: String, default: null },
    description: { type: String, default: null },
    youtubeId: { type: String, default: null },
    durationMin: { type: Number, default: 0 },
    thumbnailUrl: { type: String, default: null },
    orderIndex: { type: Number, required: true, default: 1 },
    isFree: { type: Boolean, required: true, default: false },
    published: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  [
    [{ courseId: 1 }, { name: "lectures_course_idx" }],
    [{ chapterId: 1 }, { name: "lectures_chapter_idx" }],
  ],
);
export const Lecture = compile("Lecture", lectureSchema, "lectures");

const pdfSchema = autoIncSchema(
  "pdfs",
  {
    courseId: { type: Number, required: true },
    subjectId: { type: Number, default: null },
    chapterId: { type: Number, default: null },
    title: { type: String, required: true, maxlength: 220 },
    titleMr: { type: String, default: null },
    description: { type: String, default: null },
    fileUrl: { type: String, default: null },
    storageKey: { type: String, default: null },
    fileSizeKb: { type: Number, default: 0 },
    pageCount: { type: Number, default: 0 },
    isFree: { type: Boolean, required: true, default: false },
    allowDownload: { type: Boolean, required: true, default: true },
    published: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  [[{ courseId: 1 }, { name: "pdfs_course_idx" }]],
);
export const Pdf = compile("Pdf", pdfSchema, "pdfs");

const quizSchema = autoIncSchema(
  "quizzes",
  {
    courseId: { type: Number, required: true },
    subjectId: { type: Number, default: null },
    chapterId: { type: Number, default: null },
    title: { type: String, required: true, maxlength: 220 },
    titleMr: { type: String, default: null },
    description: { type: String, default: null },
    difficulty: { type: String, required: true, default: "medium" },
    timeLimitMin: { type: Number, required: true, default: 15 },
    passingPercent: { type: Number, required: true, default: 40 },
    isFree: { type: Boolean, required: true, default: true },
    published: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  [[{ courseId: 1 }, { name: "quizzes_course_idx" }]],
);
export const Quiz = compile("Quiz", quizSchema, "quizzes");

const questionSchema = autoIncSchema(
  "questions",
  {
    quizId: { type: Number, required: true },
    orderIndex: { type: Number, required: true, default: 1 },
    text: { type: String, required: true },
    textMr: { type: String, default: null },
    options: { type: Schema.Types.Mixed, required: true },
    optionsMr: { type: Schema.Types.Mixed, default: null },
    correctIndex: { type: Number, required: true, default: 0 },
    explanation: { type: String, default: null },
    marks: { type: Number, required: true, default: 1 },
    negativeMarks: { type: Number, required: true, default: 0 },
  },
  [[{ quizId: 1 }, { name: "questions_quiz_idx" }]],
);
export const Question = compile("Question", questionSchema, "questions");

/* ------------------------------------------------------------------ */
/* Learning activity                                                   */
/* ------------------------------------------------------------------ */
const enrollmentSchema = autoIncSchema(
  "enrollments",
  {
    userId: { type: Number, required: true },
    courseId: { type: Number, required: true },
    progressPercent: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  [[{ userId: 1, courseId: 1 }, { unique: true, name: "enroll_uq" }]],
);
export const Enrollment = compile("Enrollment", enrollmentSchema, "enrollments");

const lectureProgressSchema = autoIncSchema(
  "lecture_progress",
  {
    userId: { type: Number, required: true },
    courseId: { type: Number, required: true },
    lectureId: { type: Number, required: true },
    positionSec: { type: Number, required: true, default: 0 },
    percent: { type: Number, required: true, default: 0 },
    completed: { type: Boolean, required: true, default: false },
    completedAt: { type: Date, default: null },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  [[{ userId: 1, lectureId: 1 }, { unique: true, name: "lecture_progress_uq" }]],
);
export const LectureProgress = compile(
  "LectureProgress",
  lectureProgressSchema,
  "lecture_progress",
);

const quizAttemptSchema = autoIncSchema(
  "quiz_attempts",
  {
    userId: { type: Number, required: true },
    quizId: { type: Number, required: true },
    courseId: { type: Number, default: null },
    score: { type: Number, required: true, default: 0 },
    totalMarks: { type: Number, required: true, default: 0 },
    percent: { type: Number, required: true, default: 0 },
    correct: { type: Number, required: true, default: 0 },
    incorrect: { type: Number, required: true, default: 0 },
    unanswered: { type: Number, required: true, default: 0 },
    timeTakenSec: { type: Number, required: true, default: 0 },
    passed: { type: Boolean, required: true, default: false },
    answers: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  [[{ userId: 1, quizId: 1 }, { name: "attempts_user_idx" }]],
);
export const QuizAttempt = compile("QuizAttempt", quizAttemptSchema, "quiz_attempts");

/* ------------------------------------------------------------------ */
/* Gamification                                                        */
/* ------------------------------------------------------------------ */
const xpEventSchema = autoIncSchema(
  "xp_events",
  {
    userId: { type: Number, required: true },
    kind: { type: String, required: true },
    refId: { type: String, required: true, default: "0" },
    amount: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  [
    [{ userId: 1, kind: 1, refId: 1 }, { unique: true, name: "xp_dedupe_uq" }],
    [{ userId: 1 }, { name: "xp_user_idx" }],
  ],
);
export const XpEvent = compile("XpEvent", xpEventSchema, "xp_events");

const userBadgeSchema = autoIncSchema(
  "user_badges",
  {
    userId: { type: Number, required: true },
    code: { type: String, required: true },
    earnedAt: { type: Date, required: true, default: Date.now },
  },
  [[{ userId: 1, code: 1 }, { unique: true, name: "badge_uq" }]],
);
export const UserBadge = compile("UserBadge", userBadgeSchema, "user_badges");

/* ------------------------------------------------------------------ */
/* Platform                                                            */
/* ------------------------------------------------------------------ */
const notificationSchema = autoIncSchema("notifications", {
  title: { type: String, required: true, maxlength: 200 },
  titleMr: { type: String, default: null },
  body: { type: String, default: null },
  bodyMr: { type: String, default: null },
  kind: { type: String, required: true, default: "update" },
  audience: { type: String, required: true, default: "ALL" },
  courseId: { type: Number, default: null },
  createdAt: { type: Date, required: true, default: Date.now },
});
export const Notification = compile("Notification", notificationSchema, "notifications");

const auditLogSchema = autoIncSchema("audit_logs", {
  adminId: { type: Number, default: null },
  adminName: { type: String, default: null },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String, default: null },
  detail: { type: String, default: null },
  createdAt: { type: Date, required: true, default: Date.now },
});
export const AuditLog = compile("AuditLog", auditLogSchema, "audit_logs");

const searchQuerySchema = autoIncSchema(
  "search_queries",
  {
    q: { type: String, required: true, maxlength: 160 },
    hits: { type: Number, required: true, default: 1 },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  [[{ q: 1 }, { unique: true, name: "search_q_uq" }]],
);
export const SearchQuery = compile("SearchQuery", searchQuerySchema, "search_queries");

/** Keyed by string — the old table used the `key` column as its primary key. */
const appSettingSchema = new Schema(
  { _id: String, value: { type: Schema.Types.Mixed, required: true } },
  { versionKey: false },
);
export const AppSetting = compile("AppSetting", appSettingSchema, "app_settings");

export const ALL_MODELS = {
  User,
  EmailOtp,
  Course,
  Subject,
  Chapter,
  Lecture,
  Pdf,
  Quiz,
  Question,
  Enrollment,
  LectureProgress,
  QuizAttempt,
  XpEvent,
  UserBadge,
  Notification,
  AuditLog,
  SearchQuery,
  AppSetting,
  Counter,
};
