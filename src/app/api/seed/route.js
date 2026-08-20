import { handler, ok } from "@/server/http";
import { ensureSeeded } from "@/server/seed";

export const dynamic = "force-dynamic";

export const POST = handler(async () => {
  const result = await ensureSeeded();
  return ok({ ok: true, ...result });
});

export const GET = POST;
