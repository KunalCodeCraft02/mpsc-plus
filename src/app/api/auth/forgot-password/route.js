import { connectDb, User } from "@/db";
import { handler, body, ok } from "@/server/http";
import { issueOtp, RESEND_COOLDOWN_SEC, OTP_TTL_SEC, PURPOSE } from "@/server/otp";
import { forgotSchema } from "@/server/validation";

/**
 * Email a password-reset code (replaces the Firebase reset email).
 *
 * The response is always the same neutral acknowledgement so the endpoint never
 * reveals whether an account exists — failures (unknown address, cooldown,
 * delivery problems) are logged server-side instead of being reported back.
 * Administrator accounts are deliberately excluded: staff credentials are
 * managed through the environment, not by email.
 */
export const POST = handler(async (request) => {
  const data = forgotSchema.parse(await body(request));

  await connectDb();
  const user = await User.findOne(
    { email: data.email, role: "STUDENT", status: "ACTIVE" },
    { _id: 1, name: 1 },
  ).lean();

  if (user) {
    try {
      await issueOtp({
        email: data.email,
        purpose: PURPOSE.RESET,
        name: user.name,
        payload: { userId: user._id },
      });
    } catch (err) {
      console.error("[auth] reset code not sent:", err?.message || err);
    }
  }

  return ok({
    sent: true,
    expiresInSec: OTP_TTL_SEC,
    resendAfterSec: RESEND_COOLDOWN_SEC,
  });
});
