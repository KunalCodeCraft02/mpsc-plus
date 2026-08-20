import { handler, ok, created, body, query } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { listEntity, createEntity } from "@/server/services/adminEntities";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, ctx) => {
  await requireAdmin(request);
  const { entity } = await ctx.params;
  const result = await listEntity(entity, query(request));
  return ok(result);
});

export const POST = handler(async (request, ctx) => {
  const admin = await requireAdmin(request);
  const { entity } = await ctx.params;
  const row = await createEntity(entity, await body(request), admin);
  return created({ item: row });
});
