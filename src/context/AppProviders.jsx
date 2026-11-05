"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { I18nProvider } from "./I18nContext";
import { ToastProvider } from "./ToastContext";
import { AuthProvider } from "./AuthContext";
import { AppUpdateProvider } from "./AppUpdateContext";
import { UpdateGate } from "@/components/update/UpdateGate";

function NativeBackButton() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let handle;
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp();
      }
    }).then((listener) => {
      handle = listener;
    });

    return () => {
      handle?.remove();
    };
  }, []);

  return null;
}

function NativeNavigationGuard() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    const handleClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname) return;

      event.preventDefault();
      event.stopPropagation();
      window.location.assign(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}

export default function AppProviders({ children }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <AppUpdateProvider>
            <NativeBackButton />
            <NativeNavigationGuard />
            <UpdateGate>{children}</UpdateGate>
          </AppUpdateProvider>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
