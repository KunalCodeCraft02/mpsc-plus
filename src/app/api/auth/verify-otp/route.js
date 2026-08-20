import { connectDb, User, ser } from "@/db";
import { handler, body, created, fail } from "@/server/http";
import { signToken, publicUser } from "@/server/auth";
import { verifyOtp, PURPOSE } from "@/server/otp";
import { verifyOtpSchema } from "@/server/validation";

/**
 * Step 2 of signup: verify the emailed code, then create the account and hand
 * back the same JWT the rest of the application already uses.
 */
export const POST = handler(async (request) => {
  const data = verifyOtpSchema.parse(await body(request));

  const pending = await verifyOtp({
    email: data.email,
    purpose: PURPOSE.REGISTER,
    code: data.code,
  });
  if (!pending) return fail(410, "This verification session has expired. Please start again.");

  await connectDb();
  // Re-check: someone may have registered the same email/mobile meanwhile.
  const clash = await User.findOne(
    { $or: [{ email: pending.email }, { mobile: pending.mobile }] },
    { email: 1 },
  ).lean();
  if (clash) return fail(409, "An account already exists with these details.");

  const user = ser(
    (
      await User.create({
        name: pending.name,
        email: pending.email,
        mobile: pending.mobile,
        passwordHash: pending.passwordHash,
        role: "STUDENT",
        language: pending.language,
        termsVersion: pending.termsVersion,
        privacyVersion: pending.privacyVersion,
        acceptedAt: new Date(),
        platform: pending.platform,
      })
    ).toObject(),
  );

  const token = signToken({ sub: String(user.id), role: user.role });
  return created({ token, user: publicUser(user) });
});
