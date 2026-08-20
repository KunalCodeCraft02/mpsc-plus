import { connectDb, User, ser } from "@/db";
import { handler, body, created, fail, ok } from "@/server/http";
import { signToken, publicUser } from "@/server/auth";
import { verifyFirebaseToken } from "@/server/firebaseAdmin";
import { firebaseProfileSchema } from "@/server/validation";
import { POLICY } from "@/lib/config";

export const dynamic = "force-dynamic";

function firebaseBearer(request) {
  const value = request.headers.get("authorization") || "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : null;
}

export const POST = handler(async (request) => {
  const token = firebaseBearer(request);
  if (!token) return fail(401, "Firebase authentication required");

  const claims = await verifyFirebaseToken(token);
  const email = String(claims.email || "").trim().toLowerCase();
  if (!email) return fail(401, "A verified Firebase email is required.");

  const data = firebaseProfileSchema.parse(await body(request));
  await connectDb();

  let user = await User.findOne({ firebaseUid: claims.uid }).lean();
  if (!user) user = await User.findOne({ email }).lean();
  if (user?.role === "ADMIN") return fail(403, "This sign-in method is for students only.");

  if (user) {
    user = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          firebaseUid: claims.uid,
          ...(data.name ? { name: data.name } : {}),
          ...(data.mobile ? { mobile: data.mobile } : {}),
          ...(data.language ? { language: data.language } : {}),
          platform: data.platform || "web",
        },
      },
      { returnDocument: "after" },
    ).lean();
  } else {
    if (!data.name || !data.mobile) return fail(422, "Complete your student profile before continuing.");
    user = await User.create({
      firebaseUid: claims.uid,
      name: data.name,
      email,
      mobile: data.mobile,
      role: "STUDENT",
      language: data.language,
      termsVersion: data.termsVersion || POLICY.termsVersion,
      privacyVersion: data.privacyVersion || POLICY.privacyVersion,
      acceptedAt: new Date(),
      platform: data.platform || "web",
    });
  }

  const safeUser = ser(user);
  if (safeUser.status !== "ACTIVE") return fail(403, "This account has been deactivated. Please contact support.");
  const appToken = signToken({ sub: String(safeUser.id), role: safeUser.role });
  return ok({ token: appToken, user: publicUser(safeUser) });
});
