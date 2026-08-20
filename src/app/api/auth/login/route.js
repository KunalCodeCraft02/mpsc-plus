import { connectDb, User, ser } from "@/db";
import { handler, body, ok, fail } from "@/server/http";
import { verifyPassword, signToken, publicUser } from "@/server/auth";
import { loginSchema } from "@/server/validation";
import { ensureSeeded } from "@/server/seed";
import ensureAdmin from "@/server/ensureAdmin";

export const POST = handler(async (request) => {
  const raw = await body(request);
  const data = loginSchema.parse(raw);

  try {
    await ensureSeeded();
  } catch {
    /* seeding is best-effort */
  }
  try {
    // Runs even on an already-seeded database, so the configured administrator
    // always exists and its hash matches the current environment.
    await ensureAdmin();
  } catch {
    /* provisioning is best-effort — never blocks a student login */
  }

  await connectDb();
  const typed = data.identifier.trim();
  const identifier = typed.toLowerCase();
  // Accept an email, a mobile number, or a staff username.
  const found = await User.findOne({
    $or: [{ email: identifier }, { mobile: typed }, { username: identifier }],
  }).lean();

  // Generic message — never reveal whether the account exists.
  if (!found) return fail(401, "Invalid credentials. Please check and try again.");
  const user = ser(found);

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) return fail(401, "Invalid credentials. Please check and try again.");

  if (user.status !== "ACTIVE") {
    return fail(403, "This account has been deactivated. Please contact support.");
  }

  const token = signToken({ sub: String(user.id), role: user.role });
  return ok({ token, user: publicUser(user) });
});
