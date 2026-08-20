"use client";

import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./primitives";

function useLockScroll(open) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

function Backdrop({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="fixed inset-0 z-[80] bg-ink/45 backdrop-blur-[2px] transition-opacity"
      aria-hidden="true"
    />
  );
}

/* -------------------------------- Modal ------------------------------- */
export function Modal({ open, onClose, title, description, children, footer, size = "md", className }) {
  useLockScroll(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "animate-slide-up flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-pop sm:animate-scale-in sm:rounded-2xl",
            sizes[size],
            className,
          )}
        >
          {title ? (
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-bold tracking-tight text-ink">{title}</h3>
                {description ? (
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{description}</p>
                ) : null}
              </div>
              <button
                onClick={onClose}
                className="-mr-1.5 -mt-1 rounded-lg p-2 text-muted transition hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
              </button>
            </div>
          ) : null}
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? (
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 safe-bottom">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* -------------------------------- Drawer ------------------------------ */
export function Drawer({ open, onClose, title, description, children, footer, side = "right", width = "max-w-xl" }) {
  useLockScroll(open);
  if (!open) return null;
  return (
    <>
      <Backdrop onClick={onClose} />
      <div
        className={cn(
          "fixed inset-y-0 z-[90] flex w-full flex-col bg-white shadow-pop",
          width,
          side === "right" ? "right-0" : "left-0",
        )}
        style={{ animation: "fade-up .25s ease both" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 safe-top">
          <div className="min-w-0">
            <h3 className="text-base font-bold tracking-tight text-ink">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-[13px] text-muted">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="-mr-1.5 rounded-lg p-2 text-muted transition hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 safe-bottom">
            {footer}
          </div>
        ) : null}
      </div>
    </>
  );
}

/* ------------------------------ BottomSheet --------------------------- */
export function BottomSheet({ open, onClose, title, children, footer }) {
  useLockScroll(open);
  if (!open) return null;
  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[90] flex justify-center">
        <div
          className="animate-slide-up flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-pop"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex flex-col items-center pt-2.5">
            <span className="h-1.5 w-10 rounded-full bg-slate-200" />
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-3.5">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted transition hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
          {footer ? (
            <div className="flex items-center gap-2.5 border-t border-slate-100 px-5 py-3.5 safe-bottom">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ----------------------------- ConfirmDialog -------------------------- */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5 pt-1">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            tone === "danger" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600",
          )}
        >
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[15px] font-bold text-ink">{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
        </div>
      </div>
    </Modal>
  );
}
