import { handler, body, ok } from "@/server/http";
import { resendOtp, PURPOSE } from "@/server/otp";
import { resendOtpSchema } from "@/server/validation";

/**
 * Issue a fresh signup code. The previous code stops working immediately, and
 * the cooldown / hourly cap in `@/server/otp` guards against resend abuse.
 */
export const POST = handler(async (request) => {
  const data = resendOtpSchema.parse(await body(request));
  const { expiresInSec, resendAfterSec } = await resendOtp({
    email: data.email,
    purpose: PURPOSE.REGISTER,
  });
  return ok({ sent: true, email: data.email, expiresInSec, resendAfterSec });
});
