import { connectDb, User, ser } from "@/db";
import { handler, body, created, fail } from "@/server/http";
import { hashPassword, signToken, publicUser } from "@/server/auth";
import { registerSchema } from "@/server/validation";
import { POLICY } from "@/lib/config";

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

  const passwordHash = await hashPassword(data.password);

  const user = ser(
    (
      await User.create({
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        passwordHash,
        role: "STUDENT",
        language: data.language,
        termsVersion: data.termsVersion || POLICY.termsVersion,
        privacyVersion: data.privacyVersion || POLICY.privacyVersion,
        acceptedAt: new Date(),
        platform: data.platform || "web",
      })
    ).toObject(),
  );

  const token = signToken({ sub: String(user.id), role: user.role });
  return created({ token, user: publicUser(user) });
});
