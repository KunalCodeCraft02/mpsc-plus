import { connectDb, User } from "@/db";
import { handler, body, ok, fail } from "@/server/http";
import { hashPassword } from "@/server/auth";
import { verifyOtp, PURPOSE } from "@/server/otp";
import { resetPasswordSchema } from "@/server/validation";

/**
 * Complete a password reset with the emailed code. The code is single-use and
 * the new password goes through the same bcrypt hashing as everywhere else, so
 * the existing login flow keeps working unchanged afterwards.
 */
export const POST = handler(async (request) => {
  const data = resetPasswordSchema.parse(await body(request));

  const payload = await verifyOtp({
    email: data.email,
    purpose: PURPOSE.RESET,
    code: data.code,
  });
  if (!payload?.userId) {
    return fail(410, "This reset session has expired. Please start again.");
  }

  await connectDb();
  const updated = await User.findOneAndUpdate(
    { _id: payload.userId, role: "STUDENT", status: "ACTIVE" },
    { $set: { passwordHash: await hashPassword(data.password) } },
    { returnDocument: "after" },
  ).lean();

  if (!updated) return fail(404, "This account is no longer available.");
  return ok({ reset: true });
});
