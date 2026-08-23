import { handler, body, ok } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { appUpdatePolicySchema } from "@/server/validation";
import { getUpdatePolicy, setUpdatePolicy } from "@/server/appUpdate";
import { logAudit } from "@/server/services/adminEntities";

export const dynamic = "force-dynamic";

export const GET = handler(async (request) => {
  await requireAdmin(request);
  return ok(await getUpdatePolicy());
});

export const PATCH = handler(async (request) => {
  const admin = await requireAdmin(request);
  const data = appUpdatePolicySchema.parse(await body(request));
  const policy = await setUpdatePolicy(data);
  await logAudit(
    admin,
    "UPDATE",
    "app_update",
    policy.latestVersionCode,
    `Set Android update policy to v${policy.latestVersionName} (code ${policy.latestVersionCode}, min required ${policy.minRequiredVersionCode})`,
  );
  return ok(policy);
});
