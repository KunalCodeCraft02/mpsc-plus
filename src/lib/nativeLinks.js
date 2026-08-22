"use client";

import { Capacitor } from "@capacitor/core";

/**
 * Opens an external URL (PDF file, download link, etc.) safely from inside
 * the Android app shell. A plain `<a target="_blank">` has no "new tab" to
 * open inside a Capacitor WebView, so the WebView just navigates the current
 * window to that URL in place — tearing down the whole SPA (React state,
 * auth session in memory, course/lecture context) and landing the user on a
 * bare PDF response. That's the "app reloads when I open a PDF" bug.
 *
 * On native platforms we hand the URL to Capacitor's in-app Browser overlay
 * instead, which keeps the WebView (and the app underneath it) alive. On the
 * web build this keeps the normal new-tab behavior.
 */
export async function openExternalUrl(url) {
  if (!url) return;
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
