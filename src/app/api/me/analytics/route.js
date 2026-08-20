import {
  connectDb,
  QuizAttempt,
  UserBadge,
  Enrollment,
  Lecture,
  LectureProgress,
  XpEvent,
} from "@/db";
import { handler, ok } from "@/server/http";
import { requireAuth } from "@/server/auth";
import { levelFor } from "@/lib/config";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const groupByDay = (field, accumulator) => ({
  $group: {
    _id: { $dateToString: { format: "%Y-%m-%d", date: `$${field}` } },
    n: accumulator,
  },
});

export const GET = handler(async (request) => {
  const user = await requireAuth(request);
  await connectDb();

  const since = new Date(Date.now() - 6 * DAY_MS);
  since.setUTCHours(0, 0, 0, 0);

  const [lectureDays, quizDays, xpDays, minuteDays] = await Promise.all([
    LectureProgress.aggregate([
      { $match: { userId: user.id, completed: true, completedAt: { $gte: since } } },
      groupByDay("completedAt", { $sum: 1 }),
    ]),
    QuizAttempt.aggregate([
      { $match: { userId: user.id, createdAt: { $gte: since } } },
      groupByDay("createdAt", { $sum: 1 }),
    ]),
    XpEvent.aggregate([
      { $match: { userId: user.id, createdAt: { $gte: since } } },
      groupByDay("createdAt", { $sum: "$amount" }),
    ]),
    LectureProgress.aggregate([
      { $match: { userId: user.id, completed: true, completedAt: { $gte: since } } },
      { $lookup: { from: "lectures", localField: "lectureId", foreignField: "_id", as: "l" } },
      { $unwind: "$l" },
      groupByDay("completedAt", { $sum: "$l.durationMin" }),
    ]),
  ]);

  const toMap = (rows) => new Map(rows.map((r) => [r._id, r.n]));
  const lectureMap = toMap(lectureDays);
  const quizMap = toMap(quizDays);
  const xpMap = toMap(xpDays);
  const minuteMap = toMap(minuteDays);

  const weekly = Array.from({ length: 7 }, (_, i) => {
    const day = dayKey(since.getTime() + i * DAY_MS);
    return {
      day,
      lectures: lectureMap.get(day) || 0,
      quizzes: quizMap.get(day) || 0,
      xp: xpMap.get(day) || 0,
      minutes: minuteMap.get(day) || 0,
    };
  });

  const scores = await QuizAttempt.aggregate([
    { $match: { userId: user.id } },
    { $lookup: { from: "quizzes", localField: "quizId", foreignField: "_id", as: "quiz" } },
    { $unwind: "$quiz" },
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        id: "$_id",
        percent: 1,
        createdAt: 1,
        title: "$quiz.title",
        titleMr: "$quiz.titleMr",
        passed: 1,
        score: 1,
        totalMarks: 1,
      },
    },
  ]);

  const courseProgress = await Enrollment.aggregate([
    { $match: { userId: user.id } },
    { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
    { $unwind: "$course" },
    {
      $project: {
        _id: 0,
        courseId: 1,
        title: "$course.title",
        titleMr: "$course.titleMr",
        progressPercent: 1,
      },
    },
  ]);

  const courseIds = courseProgress.map((c) => c.courseId);
  const [lectureCounts, completedCounts] = await Promise.all([
    Lecture.aggregate([
      { $match: { courseId: { $in: courseIds }, published: true } },
      { $group: { _id: "$courseId", n: { $sum: 1 } } },
    ]),
    LectureProgress.aggregate([
      { $match: { courseId: { $in: courseIds }, userId: user.id, completed: true } },
      { $group: { _id: "$courseId", n: { $sum: 1 } } },
    ]),
  ]);
  const totalMap = toMap(lectureCounts);
  const doneMap = toMap(completedCounts);

  const badges = await UserBadge.find(
    { userId: user.id },
    { code: 1, earnedAt: 1, _id: 0 },
  ).lean();

  const xpHistory = await XpEvent.aggregate([
    { $match: { userId: user.id } },
    { $group: { _id: "$kind", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  return ok({
    level: levelFor(user.xp || 0),
    xp: user.xp,
    streak: {
      current: user.streakCurrent,
      longest: user.streakLongest,
      lastStudyDate: user.lastStudyDate,
    },
    weekly,
    scores: scores.reverse(),
    courseProgress: courseProgress.map((c) => {
      const total = totalMap.get(c.courseId) || 0;
      const done = doneMap.get(c.courseId) || 0;
      return {
        ...c,
        lectureCount: total,
        completedCount: done,
        progressPercent: total ? Math.round((done / total) * 100) : 0,
      };
    }),
    badges,
    xpBreakdown: xpHistory.map((r) => ({ kind: r._id, total: r.total })),
  });
});
