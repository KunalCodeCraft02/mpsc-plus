import { connectDb, ser, AuditLog } from "@/db";
import { handler, ok, query, num } from "@/server/http";
import { requireAdmin } from "@/server/auth";

export const dynamic = "force-dynamic";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const GET = handler(async (request) => {
  await requireAdmin(request);
  await connectDb();
  const q = query(request);
  const page = Math.max(1, num(q.page, 1));
  const perPage = Math.min(100, Math.max(1, num(q.perPage, 20)));

  const where = {};
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    where.$or = [{ detail: rx }, { adminName: rx }, { entity: rx }];
  }
  if (q.entity && q.entity !== "all") where.entity = q.entity;
  if (q.action && q.action !== "all") where.action = q.action;

  const [rows, total] = await Promise.all([
    AuditLog.find(where)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    AuditLog.countDocuments(where),
  ]);

  return ok({
    items: ser(rows),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  });
});
