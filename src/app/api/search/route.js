import {
  connectDb,
  Course,
  Subject,
  Chapter,
  Lecture,
  Pdf,
  Quiz,
  Question,
  SearchQuery,
} from "@/db";
import { handler, ok, query, num } from "@/server/http";
import { ensureSeeded } from "@/server/seed";

export const dynamic = "force-dynamic";

const TYPES = ["courses", "lectures", "pdfs", "quizzes", "subjects", "chapters"];

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function popular(limit = 8) {
  return SearchQuery.find({}, { q: 1, hits: 1, _id: 0 })
    .sort({ hits: -1 })
    .limit(limit)
    .lean();
}

/**
 * Join a child collection to its published course, the way the SQL version used
 * `innerJoin(courses, ...) where courses.published`.
 */
async function withCourse(model, match, project, limit) {
  return model.aggregate([
    { $match: match },
    { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
    { $unwind: "$course" },
    { $match: { "course.published": true } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        id: "$_id",
        courseId: 1,
        courseTitle: "$course.title",
        courseTitleMr: "$course.titleMr",
        ...project,
      },
    },
  ]);
}

export const GET = handler(async (request) => {
  try {
    await ensureSeeded();
  } catch {
    /* ignore */
  }

  await connectDb();
  const p = query(request);
  const q = (p.q || "").trim();
  const type = TYPES.includes(p.type) ? p.type : "all";
  const page = Math.max(1, num(p.page, 1));
  const perPage = Math.min(50, Math.max(1, num(p.perPage, 20)));
  const access = p.access || "all";
  const language = p.language || "all";
  const category = p.category || "all";

  if (!q) {
    return ok({
      query: "",
      items: [],
      total: 0,
      popular: (await popular()).map((r) => r.q),
      suggestions: [],
      counts: {},
    });
  }

  const rx = new RegExp(escapeRegex(q), "i");

  // Log the query for the "popular searches" panel (fire and forget semantics).
  const key = q.toLowerCase().slice(0, 160);
  SearchQuery.findOneAndUpdate(
    { q: key },
    { $inc: { hits: 1 }, $set: { updatedAt: new Date() } },
  )
    .then((doc) => (doc ? null : SearchQuery.create({ q: key, hits: 1 })))
    .catch(() => {});

  const accessFilter =
    access === "free" ? { isFree: true } : access === "paid" ? { isFree: false } : {};

  /* ---- Courses ---- */
  const courseMatch = {
    published: true,
    $or: [
      { title: rx },
      { titleMr: rx },
      { description: rx },
      { instructor: rx },
      { category: rx },
    ],
    ...accessFilter,
  };
  if (category !== "all") courseMatch.category = category;
  if (language !== "all") courseMatch.language = language;

  const courseDocs = await Course.find(courseMatch).limit(50).lean();
  const courseRows = courseDocs.map((r) => ({
    id: r._id,
    title: r.title,
    titleMr: r.titleMr,
    subtitle: r.instructor,
    category: r.category,
    isFree: r.isFree,
    price: r.price,
    currency: r.currency,
    thumbnailUrl: r.thumbnailUrl,
    courseId: r._id,
    courseTitle: r.title,
  }));

  const [lectureRows, pdfRows, quizRows, subjectRows, chapterRows] = await Promise.all([
    withCourse(
      Lecture,
      {
        published: true,
        $or: [{ title: rx }, { titleMr: rx }, { description: rx }],
        ...accessFilter,
      },
      {
        title: 1,
        titleMr: 1,
        subtitle: "$description",
        isFree: 1,
        youtubeId: 1,
        durationMin: 1,
      },
      50,
    ),
    withCourse(
      Pdf,
      {
        published: true,
        $or: [{ title: rx }, { titleMr: rx }, { description: rx }],
        ...accessFilter,
      },
      {
        title: 1,
        titleMr: 1,
        subtitle: "$description",
        isFree: 1,
        pageCount: 1,
        fileSizeKb: 1,
      },
      50,
    ),
    withCourse(
      Quiz,
      {
        published: true,
        $or: [{ title: rx }, { titleMr: rx }, { description: rx }],
        ...accessFilter,
      },
      {
        title: 1,
        titleMr: 1,
        subtitle: "$description",
        isFree: 1,
        difficulty: 1,
        timeLimitMin: 1,
      },
      50,
    ),
    withCourse(
      Subject,
      { $or: [{ name: rx }, { nameMr: rx }] },
      { title: "$name", titleMr: "$nameMr", subtitle: "$description" },
      30,
    ),
    withCourse(
      Chapter,
      { $or: [{ title: rx }, { titleMr: rx }] },
      { title: 1, titleMr: 1, subtitle: "$description" },
      30,
    ),
  ]);

  // Question counts for the quiz results.
  if (quizRows.length) {
    const counts = await Question.aggregate([
      { $match: { quizId: { $in: quizRows.map((r) => r.id) } } },
      { $group: { _id: "$quizId", n: { $sum: 1 } } },
    ]);
    const map = new Map(counts.map((c) => [c._id, c.n]));
    for (const r of quizRows) r.questionCount = map.get(r.id) ?? 0;
  }

  const tag = (rows, kind) => rows.map((r) => ({ ...r, kind }));

  const buckets = {
    courses: tag(courseRows, "course"),
    lectures: tag(lectureRows, "lecture"),
    pdfs: tag(pdfRows, "pdf"),
    quizzes: tag(quizRows, "quiz"),
    subjects: tag(subjectRows, "subject"),
    chapters: tag(chapterRows, "chapter"),
  };

  const counts = Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length]));
  counts.all = Object.values(counts).reduce((a, b) => a + b, 0);

  const lower = q.toLowerCase();
  const relevance = (item) => {
    const t = String(item.title || "").toLowerCase();
    if (t === lower) return 0;
    if (t.startsWith(lower)) return 1;
    if (t.includes(lower)) return 2;
    return 3;
  };

  const merged =
    type === "all"
      ? [
          ...buckets.courses,
          ...buckets.lectures,
          ...buckets.quizzes,
          ...buckets.pdfs,
          ...buckets.subjects,
          ...buckets.chapters,
        ]
      : buckets[type] || [];

  merged.sort((a, b) => relevance(a) - relevance(b));

  const total = merged.length;
  const items = merged.slice((page - 1) * perPage, page * perPage);

  return ok({
    query: q,
    type,
    items,
    counts,
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    popular: (await popular(6)).map((r) => r.q),
  });
});
