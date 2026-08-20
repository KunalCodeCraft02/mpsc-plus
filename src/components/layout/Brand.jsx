"use client";

import { cn } from "@/lib/utils";

/** Original MPSC Pulse mark: a pulse/heartbeat wave inside a rounded shield. */
export function PulseMark({ size = 36, className, tone = "brand" }) {
  const grad = tone === "light" ? ["#ffffff", "#e0e3ff"] : ["#6c4cf1", "#3d2399"];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`pm-${tone}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={grad[0]} />
          <stop offset="100%" stopColor={grad[1]} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill={`url(#pm-${tone})`} />
      <path
        d="M9 24.5h6.2l2.9-7.4 4.1 15.2 3.7-11.2 2.6 3.4H39"
        fill="none"
        stroke={tone === "light" ? "#3d2399" : "#ffffff"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="39" cy="24.5" r="2.6" fill={tone === "light" ? "#f83b60" : "#ff5c7a"} />
    </svg>
  );
}

export function BrandLock({ size = 36, className, showTagline = true, tone = "brand", compact = false }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <PulseMark size={size} tone={tone} />
      {!compact ? (
        <div className="min-w-0 leading-none">
          <p
            className={cn(
              "font-bold tracking-tight",
              tone === "light" ? "text-white" : "text-ink",
              size >= 40 ? "text-xl" : "text-[15px]",
            )}
          >
            MPSC <span className="text-brand-600">Pulse</span>
          </p>
          {showTagline ? (
            <p
              className={cn(
                "mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                tone === "light" ? "text-white/70" : "text-muted",
              )}
            >
              Pulse of MPSC
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
