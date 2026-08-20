import {
  connectDb,
  User,
  XpEvent,
  UserBadge,
  LectureProgress,
  QuizAttempt,
} from "@/db";
import { XP_RULES } from "@/lib/config";
import { todayKey } from "@/lib/utils";

/**
 * Award XP for a verified activity.
 * Dedupe is enforced by a unique index on (userId, kind, refId), so a
 * replayed request can never grant XP twice — the duplicate insert is
 * rejected by MongoDB with error code 11000 and we award nothing.
 */
export async function awardXp(userId, kind, refId, amountOverride) {
  const amount = amountOverride ?? XP_RULES[kind] ?? 0;
  if (!amount) return 0;
  await connectDb();
  try {
    await XpEvent.create({ userId, kind, refId: String(refId ?? "0"), amount });
  } catch (err) {
    if (err?.code === 11000) return 0;
    throw err;
  }
  await User.updateOne({ _id: userId }, { $inc: { xp: amount } });
  return amount;
}

export async function grantBadge(userId, code) {
  await connectDb();
  try {
    await UserBadge.create({ userId, code });
  } catch (err) {
    if (err?.code === 11000) return null;
    throw err;
  }
  return code;
}

/** Update the study streak; awards a small bonus for each new active day. */
export async function touchStreak(userId) {
  await connectDb();
  const user = await User.findById(userId).lean();
  if (!user) return { current: 0, longest: 0, bonus: 0 };

  const today = todayKey();
  if (user.lastStudyDate === today) {
    return { current: user.streakCurrent, longest: user.streakLongest, bonus: 0 };
  }

  const yesterday = todayKey(new Date(Date.now() - 86400000));
  const current = user.lastStudyDate === yesterday ? (user.streakCurrent || 0) + 1 : 1;
  const longest = Math.max(current, user.streakLongest || 0);

  await User.updateOne(
    { _id: userId },
    { $set: { streakCurrent: current, streakLongest: longest, lastStudyDate: today } },
  );

  const bonus = await awardXp(userId, "streak_day_bonus", today);
  if (current >= 7) await grantBadge(userId, "streak_7");
  return { current, longest, bonus };
}

export async function recomputeBadges(userId) {
  await connectDb();
  const earned = [];

  const lectureCount = await LectureProgress.countDocuments({
    userId,
    completed: true,
  });

  if (lectureCount >= 1) {
    const b = await grantBadge(userId, "first_lecture");
    if (b) earned.push(b);
  }
  if (lectureCount >= 20) {
    const b = await grantBadge(userId, "bookworm");
    if (b) earned.push(b);
  }

  const attempts = await QuizAttempt.find({ userId }, { percent: 1, _id: 0 }).lean();

  if (attempts.length >= 5) {
    const b = await grantBadge(userId, "quiz_master");
    if (b) earned.push(b);
  }
  if (attempts.some((a) => a.percent >= 100)) {
    const b = await grantBadge(userId, "perfect_score");
    if (b) earned.push(b);
  }
  return earned;
}

/** Leaderboard scoped by period. Ranking blends XP with real learning output. */
export async function leaderboard({ period = "global", courseId, limit = 50 } = {}) {
  await connectDb();

  if (period === "global") {
    const rows = await User.find(
      { role: "STUDENT" },
      { name: 1, avatarUrl: 1, xp: 1, streakCurrent: 1 },
    )
      .sort({ xp: -1 })
      .limit(limit)
      .lean();
    return rows.map((r, i) => ({
      id: r._id,
      name: r.name,
      avatarUrl: r.avatarUrl,
      xp: r.xp,
      streakCurrent: r.streakCurrent,
      rank: i + 1,
      periodXp: r.xp,
    }));
  }

  const since = new Date();
  if (period === "weekly") since.setDate(since.getDate() - 7);
  else if (period === "monthly") since.setDate(since.getDate() - 30);
  else since.setFullYear(since.getFullYear() - 20);

  // `courseId` never narrowed the SQL version either (its condition was a no-op);
  // period XP is aggregated across all courses.
  void courseId;

  const rows = await XpEvent.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$userId", periodXp: { $sum: "$amount" } } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: { "user.role": "STUDENT" } },
    { $sort: { periodXp: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        id: "$_id",
        name: "$user.name",
        avatarUrl: "$user.avatarUrl",
        xp: "$user.xp",
        streakCurrent: "$user.streakCurrent",
        periodXp: 1,
      },
    },
  ]);

  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export async function userRank(userId) {
  await connectDb();
  const me = await User.findById(userId, { xp: 1 }).lean();
  const ahead = await User.countDocuments({
    role: "STUDENT",
    xp: { $gt: me?.xp ?? 0 },
  });
  return ahead + 1;
}
