import { connectDb, ser, Notification, Enrollment } from "@/db";
import { handler, ok } from "@/server/http";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export const GET = handler(async (request) => {
  const user = await currentUser(request);
  await connectDb();

  if (!user) {
    const rows = await Notification.find({ audience: "ALL" })
      .sort({ createdAt: -1, _id: -1 })
      .limit(20)
      .lean();
    return ok({ items: ser(rows) });
  }

  const myCourses = await Enrollment.find({ userId: user.id }, { courseId: 1, _id: 0 }).lean();
  const ids = myCourses.map((c) => c.courseId);

  const where = ids.length
    ? { $or: [{ audience: "ALL" }, { courseId: { $in: ids } }] }
    : { audience: "ALL" };

  const [rows, total] = await Promise.all([
    Notification.find(where).sort({ createdAt: -1, _id: -1 }).limit(40).lean(),
    Notification.countDocuments(),
  ]);

  return ok({ items: ser(rows), total });
});
