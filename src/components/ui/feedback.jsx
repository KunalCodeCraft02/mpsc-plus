"use client";

import {
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Inbox,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./primitives";

export function Loader({ size = "md", className, label }) {
  const dims = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-9 w-9 border-[3px]" };
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <span
        className={cn(
          "animate-spin rounded-full border-brand-600 border-t-transparent",
          dims[size],
        )}
      />
      {label ? <span className="text-xs font-medium text-muted">{label}</span> : null}
    </div>
  );
}

export function PageLoader({ label }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader size="lg" label={label} />
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-3.5", className)}>
      <Skeleton className="mb-3 h-32 w-full rounded-xl" />
      <Skeleton className="mb-2 h-3.5 w-3/4" />
      <Skeleton className="mb-3 h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 4, className }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3"
        >
          <Skeleton className="h-14 w-20 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 bg-slate-50/60 p-3.5">
        <Skeleton className="h-3.5 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-slate-50 p-3.5">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className={cn("h-3.5", c === 0 ? "w-1/3" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}

const ALERT_TONES = {
  info: { cls: "bg-brand-50 text-brand-800 border-brand-100", icon: Info },
  success: {
    cls: "bg-emerald-50 text-emerald-800 border-emerald-100",
    icon: CheckCircle2,
  },
  warning: { cls: "bg-amber-50 text-amber-900 border-amber-100", icon: AlertTriangle },
  danger: { cls: "bg-red-50 text-red-800 border-red-100", icon: XCircle },
};

export function Alert({ tone = "info", title, children, className, action }) {
  const conf = ALERT_TONES[tone] || ALERT_TONES.info;
  const Icon = conf.icon;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3.5", conf.cls, className)}>
      <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" style={{ height: 18, width: 18 }} />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-sm font-bold">{title}</p> : null}
        {children ? (
          <div className="text-[13px] leading-relaxed opacity-90">{children}</div>
        ) : null}
        {action ? <div className="mt-2.5">{action}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
        className,
      )}
    >
      <span className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-[15px] font-bold text-ink">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description, onRetry, retryLabel = "Try again", className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <WifiOff className="h-6 w-6" />
      </span>
      <p className="text-[15px] font-bold text-ink">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" leftIcon={RefreshCw} onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
