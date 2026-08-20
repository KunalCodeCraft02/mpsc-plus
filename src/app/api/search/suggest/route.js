import { connectDb, Course, Subject, Lecture, Quiz, Pdf, SearchQuery } from "@/db";
import { handler, ok, query } from "@/server/http";

export const dynamic = "force-dynamic";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const GET = handler(async (request) => {
  await connectDb();
  const q = (query(request).q || "").trim();
  if (q.length < 2) {
    const pop = await SearchQuery.find({}, { q: 1, _id: 0 })
      .sort({ hits: -1 })
      .limit(8)
      .lean();
    return ok({ suggestions: pop.map((p) => ({ label: p.q, kind: "popular" })) });
  }

  const rx = new RegExp(escapeRegex(q), "i");
  const [c, s, l, z, p] = await Promise.all([
    Course.find(
      { published: true, $or: [{ title: rx }, { titleMr: rx }] },
      { title: 1, titleMr: 1 },
    )
      .limit(4)
      .lean(),
    Subject.find({ $or: [{ name: rx }, { nameMr: rx }] }, { name: 1, nameMr: 1, courseId: 1 })
      .limit(4)
      .lean(),
    Lecture.find(
      { published: true, $or: [{ title: rx }, { titleMr: rx }] },
      { title: 1, titleMr: 1 },
    )
      .limit(4)
      .lean(),
    Quiz.find(
      { published: true, $or: [{ title: rx }, { titleMr: rx }] },
      { title: 1, titleMr: 1 },
    )
      .limit(4)
      .lean(),
    Pdf.find(
      { published: true, $or: [{ title: rx }, { titleMr: rx }] },
      { title: 1, titleMr: 1 },
    )
      .limit(3)
      .lean(),
  ]);

  const suggestions = [
    ...c.map((r) => ({ id: r._id, label: r.title, labelMr: r.titleMr, kind: "course" })),
    ...s.map((r) => ({
      id: r._id,
      label: r.name,
      labelMr: r.nameMr,
      courseId: r.courseId,
      kind: "subject",
    })),
    ...l.map((r) => ({ id: r._id, label: r.title, labelMr: r.titleMr, kind: "lecture" })),
    ...z.map((r) => ({ id: r._id, label: r.title, labelMr: r.titleMr, kind: "quiz" })),
    ...p.map((r) => ({ id: r._id, label: r.title, labelMr: r.titleMr, kind: "pdf" })),
  ];

  const indexed = await SearchQuery.countDocuments();

  return ok({ suggestions, indexed });
});
