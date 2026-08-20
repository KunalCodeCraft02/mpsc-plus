import { connectDb, User, ser } from "@/db";
import { handler, body, ok, fail } from "@/server/http";
import { requireAuth, publicUser } from "@/server/auth";
import { acceptPolicySchema } from "@/server/validation";
import { POLICY } from "@/lib/config";

/**
 * The server is the authority on which policy version is current — a client
 * cannot mark itself compliant by sending an arbitrary version string.
 */
export const POST = handler(async (request) => {
  const user = await requireAuth(request);
  const data = acceptPolicySchema.parse(await body(request));

  if (
    data.termsVersion !== POLICY.termsVersion ||
    data.privacyVersion !== POLICY.privacyVersion
  ) {
    return fail(409, "Policy version mismatch. Please reload and accept the latest version.", {
      current: { termsVersion: POLICY.termsVersion, privacyVersion: POLICY.privacyVersion },
    });
  }

  await connectDb();
  const updated = await User.findByIdAndUpdate(
    user.id,
    {
      $set: {
        termsVersion: POLICY.termsVersion,
        privacyVersion: POLICY.privacyVersion,
        acceptedAt: new Date(),
        platform: data.platform || user.platform || "web",
        ...(data.language ? { language: data.language } : {}),
      },
    },
    { returnDocument: "after" },
  ).lean();

  return ok({ user: publicUser(ser(updated)) });
});

export const GET = handler(async () =>
  ok({
    termsVersion: POLICY.termsVersion,
    privacyVersion: POLICY.privacyVersion,
    refundVersion: POLICY.refundVersion,
    copyrightVersion: POLICY.copyrightVersion,
    updatedAt: POLICY.updatedAt,
  }),
);
