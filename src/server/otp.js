import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDb, EmailOtp } from "@/db";
import { HttpError } from "./auth";
import { sendOtpEmail } from "./brevo";

/* ----------------------------- policy ----------------------------- */
export const OTP_LENGTH = 6;
export const OTP_TTL_SEC = 10 * 60; // codes expire after 10 minutes
export const RESEND_COOLDOWN_SEC = 60; // minimum gap between two sends
export const MAX_SENDS_PER_WINDOW = 5; // per address, per purpose
export const SEND_WINDOW_SEC = 60 * 60; // rolling one-hour window
export const MAX_ATTEMPTS = 5; // wrong guesses before the code dies

export const PURPOSE = { REGISTER: "REGISTER", RESET: "RESET" };

/** Cryptographically secure 6-digit code (000000-999999, uniform). */
function generateCode() {
  return String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

const secondsUntil = (date) => Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));

/**
 * Issue a code for `email` and deliver it through Brevo.
 *
 * The plaintext code exists only inside this function and the outgoing email —
 * it is never persisted, never logged and never returned to the caller, so it
 * cannot reach an API response or the browser.
 */
export async function issueOtp({ email, purpose, payload = null, name = null }) {
  await connectDb();
  const now = new Date();
  const existing = await EmailOtp.findOne({ email, purpose }).lean();

  if (existing) {
    const sinceLast = (now - new Date(existing.lastSentAt)) / 1000;
    if (sinceLast < RESEND_COOLDOWN_SEC) {
      throw new HttpError(
        429,
        `Please wait ${Math.ceil(RESEND_COOLDOWN_SEC - sinceLast)} seconds before requesting another code.`,
      );
    }
    const windowAge = (now - new Date(existing.windowStartedAt)) / 1000;
    if (windowAge < SEND_WINDOW_SEC && existing.sendCount >= MAX_SENDS_PER_WINDOW) {
      throw new HttpError(429, "Too many verification codes requested. Please try again later.");
    }
  }

  const windowOpen =
    existing && (now - new Date(existing.windowStartedAt)) / 1000 < SEND_WINDOW_SEC;

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(now.getTime() + OTP_TTL_SEC * 1000);

  // Overwrites any previous code for this address + purpose, so the old one
  // stops working the moment a new one is issued.
  await EmailOtp.findOneAndUpdate(
    { email, purpose },
    {
      $set: {
        codeHash,
        payload,
        attempts: 0,
        expiresAt,
        lastSentAt: now,
        sendCount: windowOpen ? (existing.sendCount || 0) + 1 : 1,
        windowStartedAt: windowOpen ? existing.windowStartedAt : now,
      },
      $setOnInsert: { email, purpose, createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );

  try {
    await sendOtpEmail({
      to: email,
      name,
      code,
      minutes: Math.round(OTP_TTL_SEC / 60),
      purpose,
    });
  } catch (err) {
    // Delivery failed, so this attempt must not consume the caller's cooldown
    // or hourly allowance. The undelivered code stays overwritten either way.
    if (existing) {
      await EmailOtp.updateOne(
        { email, purpose },
        {
          $set: {
            lastSentAt: existing.lastSentAt,
            sendCount: existing.sendCount,
            windowStartedAt: existing.windowStartedAt,
          },
        },
      );
    } else {
      await EmailOtp.deleteOne({ email, purpose });
    }
    throw err;
  }

  return {
    expiresAt,
    expiresInSec: OTP_TTL_SEC,
    resendAfterSec: RESEND_COOLDOWN_SEC,
  };
}

/** Re-send using the pending record — a resend can never target an address that never started a flow. */
export async function resendOtp({ email, purpose }) {
  await connectDb();
  const existing = await EmailOtp.findOne({ email, purpose }).lean();
  if (!existing || new Date(existing.expiresAt) <= new Date()) {
    throw new HttpError(410, "This verification session has expired. Please start again.");
  }
  return issueOtp({
    email,
    purpose,
    payload: existing.payload,
    name: existing.payload?.name || null,
  });
}

/**
 * Verify a code. On success the record is deleted, so the code is single-use.
 * Returns the stored payload (the pending signup profile, or the target user).
 */
export async function verifyOtp({ email, purpose, code }) {
  await connectDb();
  const record = await EmailOtp.findOne({ email, purpose }).lean();
  if (!record) {
    throw new HttpError(410, "This verification session has expired. Please start again.");
  }
  if (new Date(record.expiresAt) <= new Date()) {
    await EmailOtp.deleteOne({ _id: record._id });
    throw new HttpError(410, "This code has expired. Request a new one.");
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await EmailOtp.deleteOne({ _id: record._id });
    throw new HttpError(429, "Too many incorrect attempts. Please request a new code.");
  }

  const valid = await bcrypt.compare(String(code), record.codeHash);
  if (!valid) {
    const updated = await EmailOtp.findOneAndUpdate(
      { _id: record._id },
      { $inc: { attempts: 1 } },
      { returnDocument: "after" },
    ).lean();
    const left = Math.max(0, MAX_ATTEMPTS - (updated?.attempts ?? MAX_ATTEMPTS));
    if (left === 0) {
      await EmailOtp.deleteOne({ _id: record._id });
      throw new HttpError(429, "Too many incorrect attempts. Please request a new code.");
    }
    throw new HttpError(400, `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.`);
  }

  // Single use: consume the record before acting on it.
  const consumed = await EmailOtp.findOneAndDelete({ _id: record._id }).lean();
  if (!consumed) {
    throw new HttpError(410, "This code has already been used. Please request a new one.");
  }
  return consumed.payload || null;
}

/** Drop any pending code for an address (used after a successful reset). */
export async function clearOtp({ email, purpose }) {
  await connectDb();
  await EmailOtp.deleteOne({ email, purpose });
}
