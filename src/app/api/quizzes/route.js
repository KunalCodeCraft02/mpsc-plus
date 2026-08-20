import { connectDb, ser, Quiz, Question, Course, QuizAttempt } from "@/db";
import { handler, ok, query, num } from "@/server/http";
import { currentUser } from "@/server/auth";
import { ensureSeeded } from "@/server/seed";

export const dynamic = "force-dynamic";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const GET = handler(async (request) => {
  try {
    await ensureSeeded();
  } catch {
    /* ignore */
  }
  await connectDb();
  const q = query(request);
  const page = Math.max(1, num(q.page, 1));
  const perPage = Math.min(50, Math.max(1, num(q.perPage, 20)));

  const where = { published: true };
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    where.$or = [{ title: rx }, { titleMr: rx }];
  }
  if (q.courseId) where.courseId = num(q.courseId);
  if (q.difficulty && q.difficulty !== "all") where.difficulty = q.difficulty;
  if (q.access === "free") where.isFree = true;
  if (q.access === "paid") where.isFree = false;

  const [quizRows, total] = await Promise.all([
    Quiz.find(where, {
      title: 1,
      titleMr: 1,
      description: 1,
      difficulty: 1,
      timeLimitMin: 1,
      passingPercent: 1,
      isFree: 1,
      courseId: 1,
      createdAt: 1,
    })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    Quiz.countDocuments(where),
  ]);

  const rows = ser(quizRows);

  // Course labels (the old LEFT JOIN) and per-quiz question totals.
  const [courseRows, questionAgg] = await Promise.all([
    Course.find(
      { _id: { $in: [...new Set(rows.map((r) => r.courseId).filter(Boolean))] } },
      { title: 1, titleMr: 1 },
    ).lean(),
    Question.aggregate([
      { $match: { quizId: { $in: rows.map((r) => r.id) } } },
      {
        $group: {
          _id: "$quizId",
          questionCount: { $sum: 1 },
          totalMarks: { $sum: "$marks" },
        },
      },
    ]),
  ]);
  const courseMap = new Map(courseRows.map((c) => [c._id, c]));
  const qMap = new Map(questionAgg.map((a) => [a._id, a]));

  for (const r of rows) {
    const c = courseMap.get(r.courseId);
    r.courseTitle = c?.title ?? null;
    r.courseTitleMr = c?.titleMr ?? null;
    r.questionCount = qMap.get(r.id)?.questionCount ?? 0;
    r.totalMarks = qMap.get(r.id)?.totalMarks ?? 0;
  }

  const user = await currentUser(request);
  const attemptsByQuiz = {};
  if (user) {
    const attempts = ser(
      await QuizAttempt.find({ userId: user.id }).sort({ createdAt: -1, _id: -1 }).lean(),
    );
    for (const a of attempts) {
      if (!attemptsByQuiz[a.quizId]) attemptsByQuiz[a.quizId] = a;
    }
  }

  return ok({
    items: rows.map((r) => ({ ...r, attempt: attemptsByQuiz[r.id] || null })),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  });
});
