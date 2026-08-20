import { connectDb, mongoose } from "@/db";
import { ok } from "@/server/http";
import { ensureSeeded } from "@/server/seed";
import ensureAdmin from "@/server/ensureAdmin";
import { APP_VERSION } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = {
    status: "ok",
    app: "MPSC Pulse",
    version: APP_VERSION,
    time: new Date().toISOString(),
    database: "unknown",
    seeded: false,
  };

  try {
    await connectDb();
    await mongoose.connection.db.command({ ping: 1 });
    report.database = "connected";
  } catch {
    report.database = "unavailable";
    return ok(report);
  }

  try {
    const result = await ensureSeeded();
    await ensureAdmin();
    report.seeded = true;
    report.seedAction = result?.seeded ? "created" : "existing";
  } catch (err) {
    report.seeded = false;
    report.seedError = String(err?.message || err).slice(0, 200);
  }

  return ok(report);
}
