import { handler, ok, body } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { bulkEntity } from "@/server/services/adminEntities";

export const dynamic = "force-dynamic";

export const POST = handler(async (request, ctx) => {
  const admin = await requireAdmin(request);
  const { entity } = await ctx.params;
  const { action, ids } = await body(request);
  const result = await bulkEntity(entity, action, ids, admin);
  return ok(result);
});
