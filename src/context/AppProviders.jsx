"use client";

import { I18nProvider } from "./I18nContext";
import { ToastProvider } from "./ToastContext";
import { AuthProvider } from "./AuthContext";
import { AppUpdateProvider } from "./AppUpdateContext";
import { UpdateGate } from "@/components/update/UpdateGate";

export default function AppProviders({ children }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <AppUpdateProvider>
            <UpdateGate>{children}</UpdateGate>
          </AppUpdateProvider>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
