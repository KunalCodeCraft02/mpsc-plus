"use client";

import { I18nProvider } from "./I18nContext";
import { ToastProvider } from "./ToastContext";
import { AuthProvider } from "./AuthContext";

export default function AppProviders({ children }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
