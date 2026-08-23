"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import { AppUpdate, AppUpdateAvailability, FlexibleUpdateInstallStatus } from "@capawesome/capacitor-app-update";
import api from "@/services/api";

const AppUpdateContext = createContext(null);

/**
 * The full state list from the update spec. Google Play (via the
 * capacitor-app-update plugin) is the authority on whether an update is
 * ACTUALLY available; our own backend only supplies the "minimum required
 * versionCode" business rule used to decide required vs optional.
 */
export const UPDATE_STATE = {
  CHECKING_UPDATE: "CHECKING_UPDATE",
  UPDATE_AVAILABLE: "UPDATE_AVAILABLE",
  UPDATE_REQUIRED: "UPDATE_REQUIRED",
  UPDATE_NOT_AVAILABLE: "UPDATE_NOT_AVAILABLE",
  STARTING_UPDATE: "STARTING_UPDATE",
  DOWNLOADING_UPDATE: "DOWNLOADING_UPDATE",
  UPDATE_DOWNLOADED: "UPDATE_DOWNLOADED",
  INSTALLING_UPDATE: "INSTALLING_UPDATE",
  UPDATE_COMPLETED: "UPDATE_COMPLETED",
  UPDATE_CANCELLED: "UPDATE_CANCELLED",
  UPDATE_FAILED: "UPDATE_FAILED",
  PLAY_STORE_UNAVAILABLE: "PLAY_STORE_UNAVAILABLE",
  NETWORK_ERROR: "NETWORK_ERROR",
};

const IN_PROGRESS = new Set([
  UPDATE_STATE.STARTING_UPDATE,
  UPDATE_STATE.DOWNLOADING_UPDATE,
  UPDATE_STATE.UPDATE_DOWNLOADED,
  UPDATE_STATE.INSTALLING_UPDATE,
]);

const UNREACHABLE_MESSAGE =
  "Unable to check for updates. Please check your internet connection and try again.";

function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function AppUpdateProvider({ children }) {
  const android = isAndroidNative();
  const [state, setState] = useState(
    android ? UPDATE_STATE.CHECKING_UPDATE : UPDATE_STATE.UPDATE_NOT_AVAILABLE,
  );
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState(null);
  const [required, setRequired] = useState(false);
  const checkingRef = useRef(false);
  // Read inside async callbacks (startUpdate) that need the latest verdict
  // without re-subscribing to it as a dependency; kept in lockstep with the
  // `required` state set right alongside it.
  const requiredRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (!android || checkingRef.current) return;
    checkingRef.current = true;
    setState((prev) => (IN_PROGRESS.has(prev) ? prev : UPDATE_STATE.CHECKING_UPDATE));
    setMessage(null);

    let policy;
    try {
      const res = await api.get("/app/update-info");
      policy = res.data;
    } catch {
      checkingRef.current = false;
      setState(UPDATE_STATE.NETWORK_ERROR);
      setMessage(UNREACHABLE_MESSAGE);
      return;
    }

    let appInfo;
    let playInfo;
    try {
      [appInfo, playInfo] = await Promise.all([App.getInfo(), AppUpdate.getAppUpdateInfo()]);
    } catch {
      checkingRef.current = false;
      setState(UPDATE_STATE.PLAY_STORE_UNAVAILABLE);
      setMessage("Unable to reach Google Play. Please check your internet connection and try again.");
      return;
    }
    checkingRef.current = false;

    const installedVersionCode = Number(appInfo.build) || 0;
    const availableVersionCode = Number(playInfo.availableVersionCode) || 0;
    const available = playInfo.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;

    if (!available) {
      requiredRef.current = false;
      setRequired(false);
      setInfo(null);
      setState(UPDATE_STATE.UPDATE_NOT_AVAILABLE);
      return;
    }

    const isRequired =
      installedVersionCode < policy.minRequiredVersionCode &&
      availableVersionCode >= policy.minRequiredVersionCode;
    requiredRef.current = isRequired;
    setRequired(isRequired);

    setInfo({
      latestVersionName: policy.latestVersionName,
      releaseNotes: policy.releaseNotes || [],
      immediateUpdateAllowed: playInfo.immediateUpdateAllowed !== false,
      flexibleUpdateAllowed: playInfo.flexibleUpdateAllowed !== false,
    });
    setState(isRequired ? UPDATE_STATE.UPDATE_REQUIRED : UPDATE_STATE.UPDATE_AVAILABLE);
  }, [android]);

  /** UPDATE NOW — immediate flow for required updates, flexible for optional. */
  const startUpdate = useCallback(async () => {
    if (!android) return;
    const immediate = requiredRef.current;
    setState(UPDATE_STATE.STARTING_UPDATE);
    setMessage(null);
    try {
      const result = immediate
        ? await AppUpdate.performImmediateUpdate()
        : await AppUpdate.startFlexibleUpdate();

      if (result?.code === 0 /* OK */) {
        if (immediate) {
          // Android restarts the app itself once an immediate update lands;
          // this line is reached only if that hasn't happened yet.
          setState(UPDATE_STATE.UPDATE_COMPLETED);
        } else {
          setState(UPDATE_STATE.DOWNLOADING_UPDATE);
        }
        return;
      }

      // CANCELED, FAILED, NOT_AVAILABLE, NOT_ALLOWED, INFO_MISSING
      if (requiredRef.current) {
        // Mandatory: never unlock the app on cancel/failure — go back to the
        // blocking screen so the user can retry.
        setMessage("Update was not completed. Please try again to continue.");
        setState(UPDATE_STATE.UPDATE_REQUIRED);
      } else {
        setState(UPDATE_STATE.UPDATE_CANCELLED);
      }
    } catch {
      if (requiredRef.current) {
        setMessage("Update failed to start. Please try again.");
        setState(UPDATE_STATE.UPDATE_REQUIRED);
      } else {
        setState(UPDATE_STATE.UPDATE_FAILED);
      }
    }
  }, [android]);

  /** Restart & Install — completes a flexible (optional) update once downloaded. */
  const completeUpdate = useCallback(async () => {
    setState(UPDATE_STATE.INSTALLING_UPDATE);
    try {
      await AppUpdate.completeFlexibleUpdate();
      setState(UPDATE_STATE.UPDATE_COMPLETED);
    } catch {
      setState(UPDATE_STATE.UPDATE_FAILED);
      setMessage("Installing the update failed. Please try again.");
    }
  }, []);

  const dismissOptional = useCallback(() => {
    if (!requiredRef.current) setState(UPDATE_STATE.UPDATE_NOT_AVAILABLE);
  }, []);

  /* ---- Flexible-update download progress ---- */
  useEffect(() => {
    if (!android) return;
    const sub = AppUpdate.addListener("onFlexibleUpdateStateChange", (s) => {
      if (s.installStatus === FlexibleUpdateInstallStatus.DOWNLOADING) {
        setState(UPDATE_STATE.DOWNLOADING_UPDATE);
        setInfo((prev) => (prev ? { ...prev, bytesDownloaded: s.bytesDownloaded, totalBytesToDownload: s.totalBytesToDownload } : prev));
      } else if (s.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
        setState(UPDATE_STATE.UPDATE_DOWNLOADED);
      } else if (s.installStatus === FlexibleUpdateInstallStatus.FAILED) {
        setState(UPDATE_STATE.UPDATE_FAILED);
      } else if (s.installStatus === FlexibleUpdateInstallStatus.CANCELED) {
        setState(UPDATE_STATE.UPDATE_CANCELLED);
      }
    });
    return () => {
      sub.then((h) => h.remove()).catch(() => {});
    };
  }, [android]);

  /* ---- Startup check + foreground re-check (no polling) ---- */
  useEffect(() => {
    if (!android) return;
    // Deferred so the initial check does not setState inside the effect body.
    Promise.resolve().then(checkForUpdate);
    const sub = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive && !IN_PROGRESS.has(state)) checkForUpdate();
    });
    return () => {
      sub.then((h) => h.remove()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [android]);

  /* ---- FCM: registration + APP_UPDATE tap/foreground handling ---- */
  useEffect(() => {
    if (!android) return;
    let cancelled = false;

    (async () => {
      try {
        const status = await PushNotifications.checkPermissions();
        let receive = status.receive;
        // Only ask if never asked before — a prior "denied" is respected,
        // per the platform's own no-repeated-prompt rule.
        if (receive === "prompt" || receive === "prompt-with-rationale") {
          const req = await PushNotifications.requestPermissions();
          receive = req.receive;
        }
        if (!cancelled && receive === "granted") {
          await PushNotifications.register();
        }
      } catch {
        // Notification permission is optional infrastructure — the update
        // system itself still works via the startup/foreground checks above.
      }
    })();

    const regSub = PushNotifications.addListener("registration", (token) => {
      api.post("/app/fcm-token", { token: token.value }).catch(() => {});
    });
    const onTapOrReceive = (payload) => {
      const data = payload?.notification?.data || payload?.data;
      if (data?.type === "APP_UPDATE") checkForUpdate();
    };
    const receivedSub = PushNotifications.addListener("pushNotificationReceived", onTapOrReceive);
    const tapSub = PushNotifications.addListener("pushNotificationActionPerformed", onTapOrReceive);

    return () => {
      cancelled = true;
      regSub.then((h) => h.remove()).catch(() => {});
      receivedSub.then((h) => h.remove()).catch(() => {});
      tapSub.then((h) => h.remove()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [android]);

  const value = useMemo(
    () => ({ state, info, message, required, checkForUpdate, startUpdate, completeUpdate, dismissOptional }),
    [state, info, message, required, checkForUpdate, startUpdate, completeUpdate, dismissOptional],
  );

  return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
}

export function useAppUpdate() {
  const ctx = useContext(AppUpdateContext);
  if (!ctx) throw new Error("useAppUpdate must be used inside AppUpdateProvider");
  return ctx;
}
