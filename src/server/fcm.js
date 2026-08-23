/**
 * Firebase Cloud Messaging — server-only.
 *
 * Used for exactly one thing: broadcasting "a new Android build is
 * available" to the `app_updates` topic. FCM never carries course content,
 * user data or the actual update payload — it is purely a tap-to-open
 * notification; Google Play In-App Update (client-side) does the real work.
 *
 * The service-account key is read from FIREBASE_SERVICE_ACCOUNT_JSON (the
 * full JSON, as a single-line env var) and never touches the client bundle
 * or the APK — nothing in this file is importable from "use client" code.
 */
let appPromise = null;

async function getMessaging() {
  if (!appPromise) {
    appPromise = (async () => {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!raw) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON server configuration is required");
      }
      let credentials;
      try {
        credentials = JSON.parse(raw);
      } catch {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
      }
      const { initializeApp, getApps, cert } = await import("firebase-admin/app");
      const { getMessaging: getMessagingSdk } = await import("firebase-admin/messaging");
      const app = getApps()[0] || initializeApp({ credential: cert(credentials) });
      return getMessagingSdk(app);
    })().catch((err) => {
      appPromise = null;
      throw err;
    });
  }
  return appPromise;
}

export const UPDATE_TOPIC = "app_updates";

/** Subscribe a device's FCM registration token to the update-broadcast topic. */
export async function subscribeToUpdateTopic(token) {
  const messaging = await getMessaging();
  await messaging.subscribeToTopic([token], UPDATE_TOPIC);
}

/**
 * Notify every subscribed device that a new build is available. This is a
 * plain notification tap-target — the app itself re-verifies availability
 * through Google Play before ever showing the mandatory update page, so a
 * stale or duplicate send here can never lock a user out incorrectly.
 */
export async function sendUpdateNotification({ versionName, versionCode, required }) {
  const messaging = await getMessaging();
  await messaging.send({
    topic: UPDATE_TOPIC,
    notification: {
      title: "New MPSC Pulse Update",
      body: required
        ? "A new version is available. Update now to continue using MPSC Pulse."
        : "A new version of MPSC Pulse is available.",
    },
    data: {
      type: "APP_UPDATE",
      versionName: String(versionName || ""),
      versionCode: String(versionCode || ""),
    },
    android: { priority: "high" },
  });
}
