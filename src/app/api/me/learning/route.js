import { connectDb, Lecture, Enrollment, LectureProgress, QuizAttempt } from "@/db";
import { handler, ok } from "@/server/http";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export const GET = handler(async (request) => {
  const user = await requireAuth(request);
  await connectDb();

  const rows = await Enrollment.aggregate([
    { $match: { userId: user.id } },
    { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
    { $unwind: "$course" },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $project: {
        _id: 0,
        courseId: 1,
        progressPercent: 1,
        enrolledAt: "$createdAt",
        title: "$course.title",
        titleMr: "$course.titleMr",
        thumbnailUrl: "$course.thumbnailUrl",
        instructor: "$course.instructor",
        category: "$course.category",
        isFree: "$course.isFree",
        price: "$course.price",
        currency: "$course.currency",
      },
    },
  ]);

  // Per-course lecture totals and this user's completions.
  const courseIds = rows.map((r) => r.courseId);
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
  const totalMap = new Map(lectureCounts.map((c) => [c._id, c.n]));
  const doneMap = new Map(completedCounts.map((c) => [c._id, c.n]));

  const items = rows.map((r) => {
    const total = totalMap.get(r.courseId) || 0;
    const done = doneMap.get(r.courseId) || 0;
    return {
      ...r,
      lectureCount: total,
      completedCount: done,
      progressPercent: total ? Math.round((done / total) * 100) : 0,
    };
  });

  const activity = await LectureProgress.aggregate([
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
    { $limit: 8 },
    {
      $project: {
        _id: 0,
        kind: { $literal: "lecture" },
        title: "$lecture.title",
        titleMr: "$lecture.titleMr",
        at: "$updatedAt",
        courseTitle: "$course.title",
        refId: "$lecture._id",
        completed: 1,
      },
    },
  ]);

  const testActivity = await QuizAttempt.aggregate([
    { $match: { userId: user.id } },
    { $lookup: { from: "quizzes", localField: "quizId", foreignField: "_id", as: "quiz" } },
    { $unwind: "$quiz" },
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: 8 },
    {
      $project: {
        _id: 0,
        kind: { $literal: "quiz" },
        title: "$quiz.title",
        titleMr: "$quiz.titleMr",
        at: "$createdAt",
        percent: 1,
        passed: 1,
        refId: "$_id",
      },
    },
  ]);

  return ok({
    inProgress: items.filter((i) => i.progressPercent < 100),
    completed: items.filter((i) => i.progressPercent >= 100),
    activity: [...activity, ...testActivity]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 10),
  });
});
