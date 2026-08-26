import {
  connectDb,
  ser,
  User,
  UserBadge,
  LectureProgress,
  QuizAttempt,
  Enrollment,
} from "@/db";
import { handler, body, ok } from "@/server/http";
import { requireAuth, publicUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export const GET = handler(async (request) => {
  const user = await requireAuth(request);
  await connectDb();

  const [
    badges,
    lecturesStarted,
    lecturesCompleted,
    attemptAgg,
    coursesEnrolled,
    coursesCompleted,
  ] = await Promise.all([
    UserBadge.find({ userId: user.id }, { code: 1, earnedAt: 1, _id: 0 }).lean(),
    LectureProgress.countDocuments({ userId: user.id }),
    LectureProgress.countDocuments({ userId: user.id, completed: true }),
    QuizAttempt.aggregate([
      { $match: { userId: user.id } },
      { $group: { _id: null, attempts: { $sum: 1 }, avg: { $avg: "$percent" } } },
    ]),
    Enrollment.countDocuments({ userId: user.id }),
    Enrollment.countDocuments({ userId: user.id, progressPercent: { $gte: 100 } }),
  ]);

  return ok({
    user: {
      ...publicUser(user),
      badges: badges.map((b) => b.code),
      stats: {
        lecturesCompleted,
        lecturesStarted,
        quizzesAttempted: attemptAgg[0]?.attempts || 0,
        avgScore: Math.round(attemptAgg[0]?.avg || 0),
        coursesEnrolled,
        coursesCompleted,
      },
    },
  });
});

export const PATCH = handler(async (request) => {
  const user = await requireAuth(request);
  const raw = await body(request);
  const patch = {};
  if (typeof raw.name === "string" && raw.name.trim().length >= 3) patch.name = raw.name.trim();
  if (raw.language === "en" || raw.language === "mr") patch.language = raw.language;
  if (typeof raw.avatarUrl === "string") patch.avatarUrl = raw.avatarUrl.slice(0, 500);

  if (!Object.keys(patch).length) return ok({ user: publicUser(user) });

  await connectDb();
  const updated = await User.findByIdAndUpdate(user.id, { $set: patch }, { returnDocument: "after" }).lean();

  return ok({ user: publicUser(ser(updated)) });
});
