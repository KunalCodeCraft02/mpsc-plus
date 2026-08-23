import { handler, ok } from "@/server/http";
import { getUpdatePolicy } from "@/server/appUpdate";

export const dynamic = "force-dynamic";

/**
 * Public — no auth. Just version metadata, safe to read by anyone. The
 * client still verifies actual availability against Google Play before
 * treating any of this as authoritative (see AppUpdateContext).
 */
export const GET = handler(async () => ok(await getUpdatePolicy()));
