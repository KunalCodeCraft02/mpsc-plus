import {
  connectDb,
  ser,
  User,
  Course,
  Lecture,
  Pdf,
  Quiz,
  QuizAttempt,
  Enrollment,
  LectureProgress,
  AuditLog,
} from "@/db";
import { handler, ok } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { ensureSeeded } from "@/server/seed";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Matches the old `to_char(day, 'DD Mon')` label. */
const label = (d) => `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]}`;

/** Total vs published, in one pass. */
async function publishedSplit(model) {
  const [row] = await model.aggregate([
    {
      $group: {
        _id: null,
        n: { $sum: 1 },
        published: { $sum: { $cond: ["$published", 1, 0] } },
      },
    },
  ]);
  return { n: row?.n || 0, published: row?.published || 0 };
}

export const GET = handler(async (request) => {
  await requireAdmin(request);
  try {
    await ensureSeeded();
  } catch {
    /* ignore */
  }
  await connectDb();

  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

  const [
    studentCount,
    activeUsers,
    courseCount,
    lectureCount,
    pdfCount,
    quizCount,
    attemptCount,
    enrollCount,
  ] = await Promise.all([
    User.countDocuments({ role: "STUDENT" }),
    LectureProgress.distinct("userId", { updatedAt: { $gte: sevenDaysAgo } }),
    publishedSplit(Course),
    publishedSplit(Lecture),
    publishedSplit(Pdf),
    publishedSplit(Quiz),
    QuizAttempt.countDocuments(),
    Enrollment.countDocuments(),
  ]);

  /* 14-day student growth (replaces the generate_series CTE) */
  const start = new Date(Date.now() - 13 * DAY_MS);
  start.setUTCHours(0, 0, 0, 0);
  const studentDates = (
    await User.find({ role: "STUDENT" }, { createdAt: 1, _id: 0 }).lean()
  ).map((u) => new Date(u.createdAt).getTime());

  const growth = Array.from({ length: 14 }, (_, i) => {
    const dayStart = new Date(start.getTime() + i * DAY_MS);
    const dayEnd = dayStart.getTime() + DAY_MS;
    return {
      label: label(dayStart),
      value: studentDates.filter((t) => t < dayEnd).length,
      added: studentDates.filter((t) => t >= dayStart.getTime() && t < dayEnd).length,
    };
  });

  const [
    topCourses,
    recentStudents,
    recentLectures,
    recentAttempts,
    audit,
    engagement,
    quizPerf,
  ] = await Promise.all([
    Course.aggregate([
      {
        $lookup: {
          from: "enrollments",
          localField: "_id",
          foreignField: "courseId",
          as: "enrolls",
        },
      },
      {
        $lookup: {
          from: "lectures",
          localField: "_id",
          foreignField: "courseId",
          as: "lecs",
        },
      },
      { $addFields: { students: { $size: "$enrolls" }, lectures: { $size: "$lecs" } } },
      { $sort: { students: -1, _id: 1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          id: "$_id",
          title: 1,
          titleMr: 1,
          isFree: 1,
          price: 1,
          published: 1,
          students: 1,
          lectures: 1,
        },
      },
    ]),
    User.find(
      { role: "STUDENT" },
      { name: 1, email: 1, createdAt: 1, xp: 1, status: 1 },
    )
      .sort({ createdAt: -1, _id: -1 })
      .limit(6)
      .lean(),
    Lecture.aggregate([
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          id: "$_id",
          title: 1,
          createdAt: 1,
          published: 1,
          courseTitle: "$course.title",
          durationMin: 1,
        },
      },
    ]),
    QuizAttempt.aggregate([
      { $sort: { createdAt: -1, _id: -1 } },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $lookup: { from: "quizzes", localField: "quizId", foreignField: "_id", as: "quiz" } },
      { $unwind: "$quiz" },
      { $limit: 6 },
      {
        $project: {
          _id: 0,
          id: "$_id",
          percent: 1,
          passed: 1,
          createdAt: 1,
          studentName: "$user.name",
          quizTitle: "$quiz.title",
        },
      },
    ]),
    AuditLog.find().sort({ createdAt: -1, _id: -1 }).limit(6).lean(),
    Course.aggregate([
      {
        $lookup: {
          from: "lecture_progress",
          localField: "_id",
          foreignField: "courseId",
          as: "progress",
        },
      },
      { $project: { _id: 0, label: "$title", value: { $size: "$progress" } } },
      { $sort: { value: -1 } },
      { $limit: 6 },
    ]),
    Quiz.aggregate([
      {
        $lookup: {
          from: "quiz_attempts",
          localField: "_id",
          foreignField: "quizId",
          as: "attempts",
        },
      },
      {
        $project: {
          _id: 0,
          label: "$title",
          attempts: { $size: "$attempts" },
          value: {
            $ifNull: [{ $round: [{ $avg: "$attempts.percent" }, 0] }, 0],
          },
        },
      },
      { $sort: { attempts: -1 } },
      { $limit: 6 },
    ]),
  ]);

  return ok({
    cards: {
      students: studentCount,
      activeStudents: activeUsers.length,
      courses: courseCount.n,
      coursesPublished: courseCount.published,
      lectures: lectureCount.n,
      lecturesPublished: lectureCount.published,
      pdfs: pdfCount.n,
      pdfsPublished: pdfCount.published,
      quizzes: quizCount.n,
      quizzesPublished: quizCount.published,
      attempts: attemptCount,
      enrollments: enrollCount,
    },
    growth,
    engagement,
    quizPerformance: quizPerf,
    topCourses,
    recentStudents: ser(recentStudents),
    recentLectures,
    recentAttempts,
    audit: ser(audit),
  });
});
