"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, cls: "text-teal-600", ring: "ring-teal-500/20" },
  error: { icon: XCircle, cls: "text-accent-600", ring: "ring-accent-500/20" },
  warning: { icon: AlertTriangle, cls: "text-amber-500", ring: "ring-amber-500/20" },
  info: { icon: Info, cls: "text-brand-600", ring: "ring-brand-500/20" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, opts = {}) => {
      const id = Math.random().toString(36).slice(2);
      const item = {
        id,
        message,
        tone: opts.tone || "success",
        title: opts.title,
      };
      setToasts((prev) => [...prev, item]);
      setTimeout(() => dismiss(id), opts.duration || 3600);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      toast,
      success: (m, o) => toast(m, { ...o, tone: "success" }),
      error: (m, o) => toast(m, { ...o, tone: "error" }),
      info: (m, o) => toast(m, { ...o, tone: "info" }),
      warning: (m, o) => toast(m, { ...o, tone: "warning" }),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3 pb-1 pt-[calc(1rem+var(--sat))] sm:items-end sm:px-5"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const tone = TONES[t.tone] || TONES.info;
          const Icon = tone.icon;
          return (
            <div
              key={t.id}
              className={cn(
                "animate-fade-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-white p-3.5 shadow-pop ring-1",
                tone.ring,
              )}
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone.cls)} />
              <div className="min-w-0 flex-1">
                {t.title ? (
                  <p className="text-sm font-semibold text-ink">{t.title}</p>
                ) : null}
                <p className="text-sm leading-snug text-muted">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-muted transition hover:bg-slate-100"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
