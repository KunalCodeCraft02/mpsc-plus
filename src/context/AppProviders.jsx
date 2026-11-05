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

export default function AppProviders({ children }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <AppUpdateProvider>
            <NativeBackButton />
            <UpdateGate>{children}</UpdateGate>
          </AppUpdateProvider>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
