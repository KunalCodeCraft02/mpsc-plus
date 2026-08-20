"use client";

import { forwardRef, useId, useState } from "react";
import { ChevronDown, Eye, EyeOff, Check } from "lucide-react";
import { cn, initials } from "@/lib/utils";

/* ------------------------------- Button ------------------------------- */
const BTN_VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-soft hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:text-brand-300",
  outline:
    "border border-slate-200 bg-white text-ink hover:bg-slate-50 active:bg-slate-100",
  ghost: "text-ink hover:bg-slate-100 active:bg-slate-200",
  danger: "bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800",
  accent: "bg-accent-500 text-white hover:bg-accent-600",
  dark: "bg-ink text-white hover:bg-ink/90",
  success: "bg-teal-600 text-white hover:bg-teal-600/90",
};

const BTN_SIZES = {
  xs: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

export const Button = forwardRef(function Button(
  {
    as: Tag = "button",
    variant = "primary",
    size = "md",
    className,
    loading = false,
    disabled,
    fullWidth,
    leftIcon: Left,
    rightIcon: Right,
    children,
    ...props
  },
  ref,
) {
  return (
    <Tag
      ref={ref}
      disabled={Tag === "button" ? disabled || loading : undefined}
      className={cn(
        "relative inline-flex select-none items-center justify-center font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-70",
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : Left ? (
        <Left className={size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : null}
      {children}
      {!loading && Right ? (
        <Right className={size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : null}
    </Tag>
  );
});

export function IconButton({ className, label, children, ...props }) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink transition hover:bg-slate-100 active:bg-slate-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* -------------------------------- Field ------------------------------- */
function FieldShell({ label, hint, error, required, htmlFor, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="block text-[13px] font-semibold text-ink"
        >
          {label}
          {required ? <span className="text-accent-600"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-accent-600">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL =
  "w-full rounded-xl border bg-white px-3.5 text-[15px] text-ink placeholder:text-slate-400 transition " +
  "focus:outline-none focus:ring-4 focus:ring-brand-500/12 disabled:bg-slate-50 disabled:text-slate-400";

export const Input = forwardRef(function Input(
  { label, hint, error, required, className, wrapperClassName, leftIcon: Left, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={props.id || id}
      className={wrapperClassName}
    >
      <div className="relative">
        {Left ? (
          <Left className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        ) : null}
        <input
          ref={ref}
          id={props.id || id}
          className={cn(
            CONTROL,
            "h-11",
            Left && "pl-10",
            error ? "border-accent-300 focus:border-accent-500" : "border-slate-200 focus:border-brand-500",
            className,
          )}
          {...props}
        />
      </div>
    </FieldShell>
  );
});

export const PasswordInput = forwardRef(function PasswordInput(
  { label, hint, error, required, showLabel = "Show", hideLabel = "Hide", ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  const id = useId();
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={props.id || id}
    >
      <div className="relative">
        <input
          ref={ref}
          id={props.id || id}
          type={show ? "text" : "password"}
          className={cn(
            CONTROL,
            "h-11 pr-11",
            error ? "border-accent-300 focus:border-accent-500" : "border-slate-200 focus:border-brand-500",
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? hideLabel : showLabel}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-ink"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, className, rows = 4, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={props.id || id}
    >
      <textarea
        ref={ref}
        id={props.id || id}
        rows={rows}
        className={cn(
          CONTROL,
          "resize-y py-2.5 leading-relaxed",
          error ? "border-accent-300" : "border-slate-200 focus:border-brand-500",
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef(function Select(
  { label, hint, error, required, className, options = [], placeholder, children, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={props.id || id}
    >
      <div className="relative">
        <select
          ref={ref}
          id={props.id || id}
          className={cn(
            CONTROL,
            "h-11 appearance-none pr-10",
            error ? "border-accent-300" : "border-slate-200 focus:border-brand-500",
            className,
          )}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={String(o.value)} value={o.value}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </FieldShell>
  );
});

export function Switch({ checked, onChange, label, description, disabled, size = "md" }) {
  const dims =
    size === "sm"
      ? { track: "h-5 w-9", knob: "h-3.5 w-3.5", shift: "translate-x-4" }
      : { track: "h-6 w-11", knob: "h-4.5 w-4.5", shift: "translate-x-5" };
  return (
    <label
      className={cn(
        "flex items-center gap-3",
        disabled ? "opacity-60" : "cursor-pointer",
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative shrink-0 rounded-full transition-colors duration-200",
          dims.track,
          checked ? "bg-brand-600" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-transform duration-200",
            dims.knob,
            checked && dims.shift,
          )}
          style={{ height: size === "sm" ? 14 : 18, width: size === "sm" ? 14 : 18 }}
        />
      </button>
      {label || description ? (
        <span className="min-w-0">
          {label ? (
            <span className="block text-sm font-medium text-ink">{label}</span>
          ) : null}
          {description ? (
            <span className="block text-xs text-muted">{description}</span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}

export function Checkbox({ checked, onChange, label, className, id: idProp, ...props }) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={!!checked}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
          checked
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-slate-300 bg-white hover:border-brand-400",
        )}
        {...props}
      >
        {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
      </button>
      {label ? (
        <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-ink">
          {label}
        </label>
      ) : null}
    </div>
  );
}

/* -------------------------------- Badge ------------------------------- */
const BADGE_TONES = {
  neutral: "bg-slate-100 text-slate-700",
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-50 text-accent-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  teal: "bg-teal-50 text-teal-600",
  amber: "bg-amber-100 text-amber-800",
  dark: "bg-ink text-white",
  outline: "border border-slate-200 text-slate-600",
};

export function Badge({ tone = "neutral", size = "md", className, icon: Icon, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        BADGE_TONES[tone],
        className,
      )}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </span>
  );
}

export function StatusBadge({ published, labels }) {
  return (
    <Badge tone={published ? "success" : "neutral"}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          published ? "bg-emerald-500" : "bg-slate-400",
        )}
      />
      {published ? labels?.published || "Published" : labels?.draft || "Draft"}
    </Badge>
  );
}

export function PriceBadge({ isFree, price, currency = "INR", labels }) {
  if (isFree) return <Badge tone="teal">{labels?.free || "Free"}</Badge>;
  return (
    <Badge tone="amber">
      {currency === "INR" ? "₹" : `${currency} `}
      {Number(price || 0).toLocaleString("en-IN")}
    </Badge>
  );
}

/* ------------------------------- Avatar ------------------------------- */
const AV_SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function Avatar({ name = "", src, size = "md", className, ring }) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-bold text-brand-700",
        AV_SIZES[size],
        ring && "ring-2 ring-white",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name) || "?"}</span>
      )}
    </div>
  );
}

/* ------------------------------ Progress ------------------------------ */
export function ProgressBar({
  value = 0,
  className,
  barClassName,
  size = "md",
  showLabel = false,
  tone = "brand",
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const tones = {
    brand: "bg-brand-600",
    teal: "bg-teal-500",
    accent: "bg-accent-500",
    amber: "bg-amber-500",
  };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-slate-200/80",
          size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2",
        )}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", tones[tone], barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <span className="shrink-0 text-xs font-bold tabular-nums text-muted">{pct}%</span>
      ) : null}
    </div>
  );
}

export function RingProgress({ value = 0, size = 64, stroke = 6, children, tone = "#5b34e0" }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* -------------------------------- Card -------------------------------- */
export function Card({ className, as: Tag = "div", padded = true, hover = false, children, ...props }) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-soft",
        padded && "p-4",
        hover && "transition hover:shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function SectionHeader({ title, subtitle, action, className, icon: Icon }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-ink sm:text-base">
          {Icon ? <Icon className="h-4 w-4 text-brand-600" /> : null}
          <span className="truncate">{title}</span>
        </h2>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Chip({ active, onClick, children, className, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition",
        active
          ? "border-brand-600 bg-brand-600 text-white shadow-soft"
          : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700",
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </button>
  );
}

export function Tabs({ tabs = [], value, onChange, className, fill = false }) {
  return (
    <div
      className={cn(
        "no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              "relative whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-semibold transition",
              fill && "flex-1",
              active
                ? "bg-white text-brand-700 shadow-soft"
                : "text-slate-500 hover:text-ink",
            )}
          >
            {tab.label}
            {tab.count != null ? (
              <span className="ml-1.5 text-[11px] font-bold opacity-70">{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function StatTile({ icon: Icon, label, value, tone = "brand", hint, className }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    accent: "bg-accent-50 text-accent-600",
    teal: "bg-teal-50 text-teal-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-soft", className)}>
      <div className="flex items-center gap-2.5">
        {Icon ? (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
            <Icon className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="text-lg font-bold leading-tight tracking-tight text-ink">{value}</p>
        </div>
      </div>
      {hint ? <p className="mt-2 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}
