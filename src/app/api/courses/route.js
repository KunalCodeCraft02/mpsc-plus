import { connectDb, ser, Course, Lecture, Pdf, Quiz, Enrollment } from "@/db";
import { handler, ok, query, num, bool } from "@/server/http";
import { ensureSeeded } from "@/server/seed";

export const dynamic = "force-dynamic";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** One grouped aggregate per related collection, instead of a sub-select per row. */
async function attachCounts(items) {
  if (!items.length) return;
  const ids = items.map((i) => i.id);
  const specs = [
    { key: "lectureCount", model: Lecture, match: { published: true } },
    { key: "pdfCount", model: Pdf, match: { published: true } },
    { key: "quizCount", model: Quiz, match: { published: true } },
    { key: "studentCount", model: Enrollment, match: {} },
  ];
  await Promise.all(
    specs.map(async ({ key, model, match }) => {
      const rows = await model.aggregate([
        { $match: { courseId: { $in: ids }, ...match } },
        { $group: { _id: "$courseId", n: { $sum: 1 } } },
      ]);
      const map = new Map(rows.map((r) => [r._id, r.n]));
      for (const item of items) item[key] = map.get(item.id) ?? 0;
    }),
  );
}

export const GET = handler(async (request) => {
  try {
    await ensureSeeded();
  } catch {
    /* ignore */
  }

  await connectDb();
  const q = query(request);
  const page = Math.max(1, num(q.page, 1));
  const perPage = Math.min(48, Math.max(1, num(q.perPage, 12)));

  const where = { published: true };
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    where.$or = [{ title: rx }, { titleMr: rx }, { instructor: rx }, { category: rx }];
  }
  if (q.category && q.category !== "all") where.category = q.category;
  if (q.access === "free") where.isFree = true;
  if (q.access === "paid") where.isFree = false;
  if (q.language && q.language !== "all") where.language = q.language;
  if (q.featured != null && bool(q.featured)) where.isFree = true;

  const sort =
    q.sort === "price_asc"
      ? { price: 1, _id: 1 }
      : q.sort === "price_desc"
        ? { price: -1, _id: -1 }
        : q.sort === "title"
          ? { title: 1, _id: 1 }
          : { createdAt: -1, _id: -1 };

  const projection = {
    title: 1,
    titleMr: 1,
    slug: 1,
    description: 1,
    descriptionMr: 1,
    thumbnailUrl: 1,
    instructor: 1,
    category: 1,
    language: 1,
    isFree: 1,
    price: 1,
    currency: 1,
    validityDays: 1,
    createdAt: 1,
  };

  const [rows, total, categories] = await Promise.all([
    Course.find(where, projection)
      .sort(sort)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    Course.countDocuments(where),
    Course.aggregate([
      { $match: { published: true } },
      { $group: { _id: "$category", n: { $sum: 1 } } },
    ]),
  ]);

  const items = ser(rows);
  await attachCounts(items);

  return ok({
    items,
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    facets: {
      categories: categories
        .filter((c) => c._id)
        .map((c) => ({ value: c._id, count: c.n })),
    },
  });
});
