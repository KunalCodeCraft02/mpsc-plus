import { handler, ok, body } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import {
  getEntity,
  updateEntity,
  deleteEntity,
  duplicateEntity,
} from "@/server/services/adminEntities";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, ctx) => {
  await requireAdmin(request);
  const { entity, id } = await ctx.params;
  return ok({ item: await getEntity(entity, id) });
});

export const PATCH = handler(async (request, ctx) => {
  const admin = await requireAdmin(request);
  const { entity, id } = await ctx.params;
  const payload = await body(request);
  if (payload.__action === "duplicate") {
    return ok({ item: await duplicateEntity(entity, id, admin) });
  }
  return ok({ item: await updateEntity(entity, id, payload, admin) });
});

export const POST = PATCH;

export const DELETE = handler(async (request, ctx) => {
  const admin = await requireAdmin(request);
  const { entity, id } = await ctx.params;
  await deleteEntity(entity, id, admin);
  return ok({ ok: true });
});
