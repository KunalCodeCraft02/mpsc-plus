import { connectDb, User } from "@/db";
import { handler, body, ok, fail } from "@/server/http";
import { hashPassword } from "@/server/auth";
import { issueOtp, PURPOSE } from "@/server/otp";
import { registerSchema } from "@/server/validation";
import { POLICY } from "@/lib/config";

/**
 * Step 1 of signup: validate the profile, then email a verification code.
 *
 * No `users` document is created here — the profile waits in the OTP record
 * (with the password already bcrypt-hashed) until `/api/auth/verify-otp`
 * confirms the address.
 */
export const POST = handler(async (request) => {
  const raw = await body(request);
  const data = registerSchema.parse(raw);

  await connectDb();
  const existing = await User.findOne(
    { $or: [{ email: data.email }, { mobile: data.mobile }] },
    { email: 1, mobile: 1 },
  ).lean();

  if (existing) {
    const clash = existing.email === data.email ? "email" : "mobile";
    return fail(409, `An account already exists with this ${clash}.`, { field: clash });
  }

  // Hashed now so the plaintext password is never stored, not even temporarily.
  const passwordHash = await hashPassword(data.password);

  const { expiresInSec, resendAfterSec } = await issueOtp({
    email: data.email,
    purpose: PURPOSE.REGISTER,
    name: data.name,
    payload: {
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      passwordHash,
      language: data.language,
      termsVersion: data.termsVersion || POLICY.termsVersion,
      privacyVersion: data.privacyVersion || POLICY.privacyVersion,
      platform: data.platform || "web",
    },
  });

  return ok({
    pendingVerification: true,
    email: data.email,
    expiresInSec,
    resendAfterSec,
  });
});
