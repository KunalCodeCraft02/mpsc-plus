import { connectDb, ser, User, Enrollment, XpEvent, Course } from "@/db";
import { handler, ok, query, num } from "@/server/http";
import { currentUser } from "@/server/auth";
import { leaderboard, userRank } from "@/server/gamification";
import { levelFor } from "@/lib/config";

export const dynamic = "force-dynamic";

export const GET = handler(async (request) => {
  await connectDb();
  const q = query(request);
  const period = ["global", "weekly", "monthly"].includes(q.period) ? q.period : "global";
  const courseId = q.courseId ? num(q.courseId) : null;
  const limit = Math.min(100, Math.max(5, num(q.limit, 50)));

  let rows;
  if (courseId) {
    rows = await Enrollment.aggregate([
      { $match: { courseId } },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $match: { "user.role": "STUDENT" } },
      { $sort: { progressPercent: -1, "user.xp": -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          id: "$user._id",
          name: "$user.name",
          avatarUrl: "$user.avatarUrl",
          xp: "$user.xp",
          streakCurrent: "$user.streakCurrent",
          periodXp: "$user.xp",
          progressPercent: 1,
        },
      },
    ]);
    rows = rows.map((r, i) => ({ ...r, rank: i + 1 }));
  } else {
    rows = await leaderboard({ period, limit });
  }

  const withLevel = rows.map((r) => {
    const lvl = levelFor(r.xp || 0);
    return { ...r, level: lvl.key, levelNumber: lvl.number };
  });

  const me = await currentUser(request);
  let mine = null;
  if (me) {
    const inList = withLevel.find((r) => r.id === me.id);
    const rank = inList?.rank ?? (await userRank(me.id));
    const above = withLevel.filter((r) => r.rank < rank).slice(-1)[0];
    const lvl = levelFor(me.xp || 0);
    mine = {
      id: me.id,
      name: me.name,
      avatarUrl: me.avatarUrl,
      xp: me.xp,
      streakCurrent: me.streakCurrent,
      rank,
      level: lvl.key,
      levelNumber: lvl.number,
      xpToNextRank: above ? Math.max(0, (above.periodXp ?? above.xp) - me.xp + 1) : 0,
    };
  }

  const [courseOptions, xpEventCount] = await Promise.all([
    Course.find({ published: true }, { title: 1, titleMr: 1 }).lean(),
    XpEvent.countDocuments(),
  ]);

  return ok({
    period,
    courseId,
    items: withLevel,
    me: mine,
    courses: ser(courseOptions),
    xpEventCount,
  });
});
