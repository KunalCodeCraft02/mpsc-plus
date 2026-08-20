import { connectDb, Course, Quiz, QuizAttempt, Enrollment, XpEvent } from "@/db";
import { handler, ok, query, num } from "@/server/http";
import { requireAdmin } from "@/server/auth";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (d) => `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]}`;

export const GET = handler(async (request) => {
  await requireAdmin(request);
  await connectDb();
  const q = query(request);
  const quizId = q.quizId ? num(q.quizId) : null;

  const lectureCompletion = await Course.aggregate([
    {
      $lookup: {
        from: "lectures",
        let: { cid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ["$courseId", "$$cid"] }, { $eq: ["$published", true] }] },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: "lecs",
      },
    },
    {
      $lookup: {
        from: "lecture_progress",
        let: { ids: "$lecs._id" },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $in: ["$lectureId", "$$ids"] }, { $eq: ["$completed", true] }] },
            },
          },
          { $count: "n" },
        ],
        as: "done",
      },
    },
    {
      $project: {
        _id: 0,
        label: "$title",
        total: { $size: "$lecs" },
        completed: { $ifNull: [{ $arrayElemAt: ["$done.n", 0] }, 0] },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 8 },
  ]);

  /* 14-day enrolment trend (replaces the generate_series CTE) */
  const start = new Date(Date.now() - 13 * DAY_MS);
  start.setUTCHours(0, 0, 0, 0);
  const enrollDays = await Enrollment.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        n: { $sum: 1 },
      },
    },
  ]);
  const enrollMap = new Map(enrollDays.map((d) => [d._id, d.n]));
  const enrollmentTrend = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(start.getTime() + i * DAY_MS);
    return {
      label: label(day),
      value: enrollMap.get(day.toISOString().slice(0, 10)) || 0,
    };
  });

  const quizStats = await Quiz.aggregate([
    {
      $lookup: {
        from: "questions",
        localField: "_id",
        foreignField: "quizId",
        as: "questions",
      },
    },
    {
      $lookup: {
        from: "quiz_attempts",
        localField: "_id",
        foreignField: "quizId",
        as: "attemptDocs",
      },
    },
    {
      $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        id: "$_id",
        title: 1,
        difficulty: 1,
        passingPercent: 1,
        courseTitle: "$course.title",
        questionCount: { $size: "$questions" },
        attempts: { $size: "$attemptDocs" },
        avgScore: { $ifNull: [{ $round: [{ $avg: "$attemptDocs.percent" }, 0] }, 0] },
        highest: { $ifNull: [{ $max: "$attemptDocs.percent" }, 0] },
        lowest: { $ifNull: [{ $min: "$attemptDocs.percent" }, 0] },
        avgTimeSec: { $ifNull: [{ $round: [{ $avg: "$attemptDocs.timeTakenSec" }, 0] }, 0] },
        passed: {
          $size: {
            $filter: {
              input: "$attemptDocs",
              as: "a",
              cond: { $eq: ["$$a.passed", true] },
            },
          },
        },
      },
    },
    {
      $addFields: {
        passRate: {
          $round: [
            {
              $multiply: [
                100,
                { $divide: ["$passed", { $max: ["$attempts", 1] }] },
              ],
            },
            0,
          ],
        },
      },
    },
    { $project: { passed: 0 } },
    { $sort: { attempts: -1 } },
    { $limit: 20 },
  ]);

  /* Hardest questions: share of incorrect answers across stored attempt reviews. */
  let hardest = [];
  const targetId = quizId || quizStats[0]?.id;
  if (targetId) {
    const rows = await QuizAttempt.aggregate([
      { $match: { quizId: targetId } },
      { $project: { review: { $ifNull: ["$answers.review", []] } } },
      { $unwind: "$review" },
      {
        $group: {
          _id: "$review.text",
          answered: { $sum: 1 },
          wrong: { $sum: { $cond: [{ $eq: ["$review.state", "incorrect"] }, 1, 0] } },
        },
      },
      { $sort: { wrong: -1, answered: -1 } },
      { $limit: 8 },
    ]);
    hardest = rows.map((r) => ({
      text: r._id,
      answered: r.answered,
      wrong: r.wrong,
      errorRate: r.answered ? Math.round((r.wrong / r.answered) * 100) : 0,
    }));
  }

  const xpDistribution = (
    await XpEvent.aggregate([
      { $group: { _id: "$kind", value: { $sum: "$amount" } } },
      { $sort: { value: -1 } },
    ])
  ).map((r) => ({ label: r._id, value: r.value }));

  return ok({
    lectureCompletion: lectureCompletion.map((r) => ({
      ...r,
      value: r.total ? Math.round((r.completed / r.total) * 100) : 0,
    })),
    enrollmentTrend,
    quizStats,
    hardest,
    xpDistribution,
  });
});
