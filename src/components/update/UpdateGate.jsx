"use client";

import { useState } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { PulseMark } from "@/components/layout/Brand";
import { Button, ProgressBar, Alert } from "@/components/ui";
import { useAppUpdate, UPDATE_STATE } from "@/context/AppUpdateContext";

const BLOCKING_STATES = new Set([
  UPDATE_STATE.UPDATE_REQUIRED,
  UPDATE_STATE.STARTING_UPDATE,
  UPDATE_STATE.UPDATE_COMPLETED,
]);

/**
 * Mounted once near the app root. Renders the app normally in every case
 * except a *confirmed* (Google Play-verified) mandatory update — see
 * AppUpdateContext for why CHECKING_UPDATE/NETWORK_ERROR/PLAY_STORE_UNAVAILABLE
 * never block: an unverified state must never be treated as "required".
 */
export function UpdateGate({ children }) {
  const { state, required } = useAppUpdate();

  if (required && BLOCKING_STATES.has(state)) {
    return <MandatoryUpdatePage />;
  }

  return (
    <>
      {children}
      <OptionalUpdateBanner />
    </>
  );
}

function MandatoryUpdatePage() {
  const { state, info, message, startUpdate } = useAppUpdate();
  const busy = state === UPDATE_STATE.STARTING_UPDATE;
  const completed = state === UPDATE_STATE.UPDATE_COMPLETED;

  return (
    <div className="fixed inset-0 z-[999] flex min-h-dvh flex-col overflow-y-auto bg-gradient-to-b from-brand-800 via-brand-900 to-brand-950 text-white">
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-white/[0.06]" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-accent-500/15" />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-[calc(2.5rem+var(--sat))] text-center safe-bottom">
        <div className="relative">
          <span className="absolute inset-0 rounded-2xl bg-white/25 animate-pulse-ring" />
          <PulseMark size={64} tone="light" className="relative" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">New Update Available</h1>
        <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.2em] text-white/55">
          MPSC Pulse
        </p>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/80">
          {completed
            ? "Update completed. Restarting MPSC Pulse…"
            : "A new version of the app is available. Please update to continue using MPSC Pulse."}
        </p>

        {!completed && info?.releaseNotes?.length ? (
          <div className="mt-6 w-full max-w-sm rounded-2xl bg-white/10 p-4 text-left">
            <p className="text-[12px] font-bold uppercase tracking-wide text-white/60">
              What&apos;s New
            </p>
            <ul className="mt-2 space-y-1.5 text-[13.5px] text-white/85">
              {info.releaseNotes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {message ? (
          <Alert tone="danger" className="mt-5 w-full max-w-sm text-left">
            {message}
          </Alert>
        ) : null}

        {!completed ? (
          <div className="mt-8 w-full max-w-sm">
            <Button
              size="lg"
              fullWidth
              loading={busy}
              disabled={busy}
              onClick={startUpdate}
              className="bg-white text-brand-800 hover:bg-white/90"
            >
              {busy ? "Starting update…" : "UPDATE NOW"}
            </Button>
            <p className="mt-4 text-[12px] text-white/55">
              Please update to continue. The update is provided securely through Google Play.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Non-blocking: an optional update never prevents using the app. */
function OptionalUpdateBanner() {
  const { state, info, message, startUpdate, completeUpdate, dismissOptional } = useAppUpdate();
  const [dismissedFailure, setDismissedFailure] = useState(false);

  if (state === UPDATE_STATE.UPDATE_AVAILABLE) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg p-3 pb-[calc(0.75rem+var(--sab))]">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-lg shadow-slate-900/10">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-ink">New update available</p>
            <p className="truncate text-[12px] text-muted">
              {info?.latestVersionName ? `MPSC Pulse v${info.latestVersionName} is ready.` : "A newer version is ready."}
            </p>
          </div>
          <Button size="sm" onClick={startUpdate}>Update</Button>
          <button
            type="button"
            onClick={dismissOptional}
            aria-label="Later"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (state === UPDATE_STATE.DOWNLOADING_UPDATE) {
    const pct = info?.totalBytesToDownload
      ? Math.round(((info.bytesDownloaded || 0) / info.totalBytesToDownload) * 100)
      : 0;
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg p-3 pb-[calc(0.75rem+var(--sab))]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-lg shadow-slate-900/10">
          <p className="text-[13.5px] font-semibold text-ink">Downloading update…</p>
          <ProgressBar value={pct} showLabel className="mt-2.5" />
        </div>
      </div>
    );
  }

  if (state === UPDATE_STATE.UPDATE_DOWNLOADED) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg p-3 pb-[calc(0.75rem+var(--sab))]">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-lg shadow-slate-900/10">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
            <RefreshCw className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-ink">Update downloaded</p>
            <p className="text-[12px] text-muted">Restart to finish installing.</p>
          </div>
          <Button size="sm" onClick={completeUpdate}>Restart &amp; Install</Button>
        </div>
      </div>
    );
  }

  if (state === UPDATE_STATE.UPDATE_FAILED && message && !dismissedFailure) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg p-3 pb-[calc(0.75rem+var(--sab))]">
        <Alert
          tone="danger"
          className="shadow-lg"
          action={
            <Button size="sm" variant="outline" onClick={() => setDismissedFailure(true)}>
              Dismiss
            </Button>
          }
        >
          {message}
        </Alert>
      </div>
    );
  }

  return null;
}
