import { connectDb, Pdf, Enrollment } from "@/db";
import { handler, ok, query, num } from "@/server/http";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const GET = handler(async (request) => {
  await connectDb();
  const q = query(request);
  const page = Math.max(1, num(q.page, 1));
  const perPage = Math.min(60, Math.max(1, num(q.perPage, 24)));

  const match = { published: true };
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    match.$or = [{ title: rx }, { titleMr: rx }];
  }
  if (q.courseId) match.courseId = num(q.courseId);
  if (q.access === "free") match.isFree = true;
  if (q.access === "paid") match.isFree = false;

  // $unwind without preserveNull is an inner join on courses; the chapter
  // lookup preserves nulls, matching the original LEFT JOIN.
  const joined = [
    { $match: match },
    {
      $lookup: {
        from: "courses",
        localField: "courseId",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
    { $match: { "course.published": true } },
  ];

  const [rows, countRows] = await Promise.all([
    Pdf.aggregate([
      ...joined,
      {
        $lookup: {
          from: "chapters",
          localField: "chapterId",
          foreignField: "_id",
          as: "chapter",
        },
      },
      { $unwind: { path: "$chapter", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: (page - 1) * perPage },
      { $limit: perPage },
      {
        $project: {
          _id: 0,
          id: "$_id",
          title: 1,
          titleMr: 1,
          description: 1,
          pageCount: 1,
          fileSizeKb: 1,
          isFree: 1,
          allowDownload: 1,
          courseId: 1,
          courseTitle: "$course.title",
          courseTitleMr: "$course.titleMr",
          courseIsFree: "$course.isFree",
          chapterTitle: "$chapter.title",
        },
      },
    ]),
    Pdf.aggregate([...joined, { $count: "n" }]),
  ]);

  const total = countRows[0]?.n || 0;

  const user = await currentUser(request);
  let enrolled = new Set();
  if (user) {
    const rowsE = await Enrollment.find({ userId: user.id }, { courseId: 1, _id: 0 }).lean();
    enrolled = new Set(rowsE.map((r) => r.courseId));
  }

  return ok({
    items: rows.map((r) => ({
      ...r,
      chapterTitle: r.chapterTitle ?? null,
      locked: !(
        r.isFree ||
        r.courseIsFree ||
        enrolled.has(r.courseId) ||
        user?.role === "ADMIN"
      ),
    })),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  });
});
