import {
  connectDb,
  ser,
  Course,
  Lecture,
  Quiz,
  Question,
  Enrollment,
  LectureProgress,
  QuizAttempt,
  Notification,
  UserBadge,
  XpEvent,
} from "@/db";
import { handler, ok } from "@/server/http";
import { requireAuth } from "@/server/auth";
import { userRank } from "@/server/gamification";
import { levelFor } from "@/lib/config";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

export const GET = handler(async (request) => {
  const user = await requireAuth(request);
  await connectDb();

  const myEnrollments = await Enrollment.aggregate([
    { $match: { userId: user.id } },
    { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
    { $unwind: "$course" },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $project: {
        _id: 0,
        courseId: 1,
        progressPercent: 1,
        title: "$course.title",
        titleMr: "$course.titleMr",
        thumbnailUrl: "$course.thumbnailUrl",
        instructor: "$course.instructor",
        isFree: "$course.isFree",
        price: "$course.price",
        currency: "$course.currency",
        category: "$course.category",
      },
    },
  ]);

  const recentProgress = await LectureProgress.aggregate([
    { $match: { userId: user.id } },
    { $lookup: { from: "lectures", localField: "lectureId", foreignField: "_id", as: "lecture" } },
    { $unwind: "$lecture" },
    {
      $lookup: {
        from: "courses",
        localField: "lecture.courseId",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
    { $sort: { updatedAt: -1, _id: -1 } },
    { $limit: 6 },
    {
      $project: {
        _id: 0,
        lectureId: 1,
        percent: 1,
        completed: 1,
        updatedAt: 1,
        title: "$lecture.title",
        titleMr: "$lecture.titleMr",
        youtubeId: "$lecture.youtubeId",
        durationMin: "$lecture.durationMin",
        courseId: "$lecture.courseId",
        courseTitle: "$course.title",
        courseTitleMr: "$course.titleMr",
      },
    },
  ]);

  const upcomingTests = ser(
    await Quiz.find(
      { published: true },
      { title: 1, titleMr: 1, difficulty: 1, timeLimitMin: 1, isFree: 1, courseId: 1 },
    )
      .sort({ createdAt: -1, _id: -1 })
      .limit(4)
      .lean(),
  );
  if (upcomingTests.length) {
    const counts = await Question.aggregate([
      { $match: { quizId: { $in: upcomingTests.map((t) => t.id) } } },
      { $group: { _id: "$quizId", n: { $sum: 1 } } },
    ]);
    const map = new Map(counts.map((c) => [c._id, c.n]));
    for (const t of upcomingTests) t.questionCount = map.get(t.id) ?? 0;
  }

  const recommended = ser(
    await Course.find(
      { published: true },
      {
        title: 1,
        titleMr: 1,
        thumbnailUrl: 1,
        instructor: 1,
        isFree: 1,
        price: 1,
        currency: 1,
        category: 1,
      },
    )
      .sort({ createdAt: -1, _id: -1 })
      .limit(8)
      .lean(),
  );
  if (recommended.length) {
    const counts = await Lecture.aggregate([
      { $match: { courseId: { $in: recommended.map((c) => c.id) }, published: true } },
      { $group: { _id: "$courseId", n: { $sum: 1 } } },
    ]);
    const map = new Map(counts.map((c) => [c._id, c.n]));
    for (const c of recommended) c.lectureCount = map.get(c.id) ?? 0;
  }

  const enrolledIds = new Set(myEnrollments.map((e) => e.courseId));
  for (const course of recommended) course.isPurchased = enrolledIds.has(course.id);

  /* Last 7 days of activity (replaces the generate_series CTE) */
  const since = new Date(Date.now() - 6 * DAY_MS);
  since.setUTCHours(0, 0, 0, 0);
  const [lectureDays, quizDays, xpDays, badgeRows, attemptAgg, rank, notif] =
    await Promise.all([
      LectureProgress.aggregate([
        { $match: { userId: user.id, completed: true, completedAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
            n: { $sum: 1 },
          },
        },
      ]),
      QuizAttempt.aggregate([
        { $match: { userId: user.id, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            n: { $sum: 1 },
          },
        },
      ]),
      XpEvent.aggregate([
        { $match: { userId: user.id, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            n: { $sum: "$amount" },
          },
        },
      ]),
      UserBadge.find({ userId: user.id }, { code: 1, _id: 0 }).lean(),
      QuizAttempt.aggregate([
        { $match: { userId: user.id } },
        { $group: { _id: null, attempts: { $sum: 1 }, avg: { $avg: "$percent" } } },
      ]),
      userRank(user.id),
      Notification.find().sort({ createdAt: -1, _id: -1 }).limit(3).lean(),
    ]);

  const lectureMap = new Map(lectureDays.map((d) => [d._id, d.n]));
  const quizMap = new Map(quizDays.map((d) => [d._id, d.n]));
  const xpMap = new Map(xpDays.map((d) => [d._id, d.n]));

  const weekly = Array.from({ length: 7 }, (_, i) => {
    const day = dayKey(since.getTime() + i * DAY_MS);
    return {
      day,
      lectures: lectureMap.get(day) || 0,
      quizzes: quizMap.get(day) || 0,
      xp: xpMap.get(day) || 0,
    };
  });

  const level = levelFor(user.xp || 0);

  return ok({
    profile: {
      id: user.id,
      name: user.name,
      language: user.language,
      xp: user.xp,
      streakCurrent: user.streakCurrent,
      streakLongest: user.streakLongest,
      rank,
      level,
      badges: badgeRows.map((b) => b.code),
    },
    continueLearning: recentProgress.filter((r) => !r.completed).slice(0, 3),
    recentLectures: recentProgress.slice(0, 5),
    myCourses: myEnrollments,
    upcomingTests,
    recommended: recommended.filter((c) => !enrolledIds.has(c.id)).slice(0, 6),
    weekly,
    stats: {
      quizzesAttempted: attemptAgg[0]?.attempts || 0,
      avgScore: Math.round(attemptAgg[0]?.avg || 0),
      coursesEnrolled: myEnrollments.length,
    },
    notifications: ser(notif),
  });
});
