import { connectDb, AppSetting } from "@/db";
import { sendUpdateNotification } from "./fcm";

/** Singleton key in the existing `app_settings` collection. */
const KEY = "android_update_policy";

const DEFAULT_POLICY = {
  minRequiredVersionCode: 1,
  latestVersionCode: 1,
  latestVersionName: "1.0.0",
  releaseNotes: [],
  updatedAt: null,
};

/** Read the current Android version policy (public — no secrets in it). */
export async function getUpdatePolicy() {
  await connectDb();
  const row = await AppSetting.findById(KEY).lean();
  return row ? { ...DEFAULT_POLICY, ...row.value } : DEFAULT_POLICY;
}

/**
 * Persist a new version policy and broadcast it over FCM. The FCM send is
 * best-effort: Google Play — checked client-side — remains the actual
 * authority on whether an update is available, so a failed/duplicate/late
 * notification can never mis-lock or mis-unlock the app.
 */
export async function setUpdatePolicy(data) {
  await connectDb();
  const value = {
    minRequiredVersionCode: data.minRequiredVersionCode,
    latestVersionCode: data.latestVersionCode,
    latestVersionName: data.latestVersionName,
    releaseNotes: data.releaseNotes || [],
    updatedAt: new Date().toISOString(),
  };
  await AppSetting.findByIdAndUpdate(KEY, { $set: { value } }, { upsert: true });

  try {
    await sendUpdateNotification({
      versionName: value.latestVersionName,
      versionCode: value.latestVersionCode,
      required: value.minRequiredVersionCode >= value.latestVersionCode,
    });
  } catch (err) {
    // Never let a notification-delivery failure block saving the policy —
    // Play Store availability is what actually gates the update page.
    console.error("[fcm] update broadcast failed:", err?.message || err);
  }

  return value;
}
