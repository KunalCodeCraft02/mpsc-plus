import { connectDb, User } from "@/db";
import { hashPassword } from "./auth";
import { POLICY } from "@/lib/config";

/**
 * Administrator provisioning.
 *
 * The handle and password come from the environment so they can be rotated
 * without a code change. Nothing in this file is ever imported by client code — it runs only inside route
 * handlers — and the password is bcrypt-hashed before it reaches MongoDB, so
 * the plaintext is never stored or returned by any API.
 */
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "mpscvb").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "MPSC Pulse Admin";

/** Internal, non-advertised address — the admin signs in with the username. */
const ADMIN_EMAIL = `${ADMIN_USERNAME}@mpscpulse.internal`;
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || "9800000001";

/** Seeded demo administrator from earlier builds, retired by this routine. */
const LEGACY_ADMIN_EMAIL = "admin@mpscpulse.in";

let ensurePromise = null;

async function run() {
  if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD server configuration is required");
  }
  await connectDb();
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  // Retire the legacy demo admin by converting it into the real one, so the
  // existing account (and its audit history) carries over instead of leaving a
  // second admin able to sign in with published credentials.
  const legacy = await User.findOne({ email: LEGACY_ADMIN_EMAIL }).lean();
  if (legacy) {
    await User.updateOne(
      { _id: legacy._id },
      {
        $set: {
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          passwordHash,
          role: "ADMIN",
          status: "ACTIVE",
        },
      },
    );
    return { action: "migrated", id: legacy._id };
  }

  const existing = await User.findOne({ username: ADMIN_USERNAME }).lean();
  if (existing) {
    // Keep the hash in step with the configured password on every boot.
    await User.updateOne(
      { _id: existing._id },
      { $set: { passwordHash, role: "ADMIN", status: "ACTIVE" } },
    );
    return { action: "refreshed", id: existing._id };
  }

  const created = await User.create({
    name: ADMIN_NAME,
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    mobile: ADMIN_MOBILE,
    passwordHash,
    role: "ADMIN",
    language: "en",
    termsVersion: POLICY.termsVersion,
    privacyVersion: POLICY.privacyVersion,
    acceptedAt: new Date(),
    xp: 0,
  });
  return { action: "created", id: created._id };
}

/** Idempotent, single-flight administrator provisioning. */
export function ensureAdmin() {
  if (!ensurePromise) {
    ensurePromise = run().catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }
  return ensurePromise;
}

export default ensureAdmin;
