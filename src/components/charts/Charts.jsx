"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Lightweight dependency-free SVG charts (keeps the bundle small). */

export function LineChart({ data = [], height = 180, color = "#5b34e0", fill = true, className }) {
  const { path, area, max, points } = useMemo(() => {
    const vals = data.map((d) => Number(d.value) || 0);
    const max = Math.max(1, ...vals);
    const w = 100;
    const step = data.length > 1 ? w / (data.length - 1) : w;
    const pts = vals.map((v, i) => ({ x: i * step, y: 100 - (v / max) * 88 - 6 }));
    const path = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");
    const area = `${path} L100,100 L0,100 Z`;
    return { path, area, max, points: pts };
  }, [data]);

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }} className="w-full overflow-visible">
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#eef0f6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        ))}
        {fill ? (
          <>
            <defs>
              <linearGradient id={`lg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#lg-${color.replace("#", "")})`} />
          </>
        ) : null}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.6" fill="#fff" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] font-medium text-muted">
        {data.map((d, i) => (
          <span key={i} className="flex-1 truncate text-center">
            {d.label}
          </span>
        ))}
      </div>
      <span className="sr-only">Max value {max}</span>
    </div>
  );
}

export function BarChart({ data = [], height = 180, color = "#6c4cf1", className, unit = "" }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = ((Number(d.value) || 0) / max) * 100;
          return (
            <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[10px] font-bold text-ink opacity-0 transition group-hover:opacity-100">
                {d.value}
                {unit}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max(3, h)}%`,
                  background: d.color || color,
                  opacity: d.dim ? 0.35 : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 text-[10px] font-medium text-muted">
        {data.map((d, i) => (
          <span key={i} className="flex-1 truncate text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({ segments = [], size = 148, thickness = 22, centerLabel, centerValue }) {
  const total = segments.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f6" strokeWidth={thickness} />
          {segments.map((s, i) => {
            const len = ((Number(s.value) || 0) / total) * c;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tracking-tight text-ink">{centerValue}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[12.5px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate text-muted">{s.label}</span>
            <span className="font-bold text-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({ data = [], color = "#12b981", height = 40 }) {
  const vals = data.map((v) => Number(v) || 0);
  const max = Math.max(1, ...vals);
  const step = vals.length > 1 ? 100 / (vals.length - 1) : 100;
  const path = vals
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(100 - (v / max) * 90).toFixed(2)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }} className="w-full">
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

export function HeatStrip({ days = [], className }) {
  const max = Math.max(1, ...days.map((d) => d.value || 0));
  return (
    <div className={cn("flex gap-1.5", className)}>
      {days.map((d, i) => {
        const intensity = (d.value || 0) / max;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              title={`${d.label}: ${d.value}`}
              className="h-9 w-full rounded-md transition"
              style={{
                background:
                  intensity === 0
                    ? "#eef0f6"
                    : `rgba(91, 52, 224, ${0.18 + intensity * 0.82})`,
              }}
            />
            <span className="text-[10px] font-semibold text-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
