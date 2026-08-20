"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  Library,
  ListTree,
  Video,
  FileText,
  ClipboardList,
  Users,
  Trophy,
  BarChart3,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ChevronRight,
  Search,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Avatar, Badge, Button } from "@/components/ui";
import { PulseMark } from "./Brand";

const NAV = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "courses", href: "/admin/courses", icon: GraduationCap },
  { key: "subjects", href: "/admin/subjects", icon: Library },
  { key: "chapters", href: "/admin/chapters", icon: ListTree },
  { key: "lectures", href: "/admin/lectures", icon: Video },
  { key: "pdfs", href: "/admin/pdfs", icon: FileText },
  { key: "quizzes", href: "/admin/quizzes", icon: ClipboardList },
  { key: "students", href: "/admin/students", icon: Users },
  { key: "leaderboard", href: "/admin/leaderboard", icon: Trophy },
  { key: "analytics", href: "/admin/analytics", icon: BarChart3 },
  { key: "notifications", href: "/admin/notifications", icon: Bell },
  { key: "settings", href: "/admin/settings", icon: Settings },
];

const GROUPS = [
  { label: "Overview", keys: ["dashboard"] },
  { label: "Content", keys: ["courses", "subjects", "chapters", "lectures", "pdfs", "quizzes"] },
  { label: "Community", keys: ["students", "leaderboard"] },
  { label: "Insights", keys: ["analytics", "notifications", "settings"] },
];

function active(pathname, href) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNav({ onNavigate }) {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.keys.map((key) => {
              const item = NAV.find((n) => n.key === key);
              if (!item) return null;
              const Icon = item.icon;
              const isOn = active(pathname, item.href);
              return (
                <Link
                  key={key}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition",
                    isOn
                      ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]"
                      : "text-white/60 hover:bg-white/[0.07] hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={isOn ? 2.4 : 2} />
                  <span className="truncate">{t(`admin.${key}`)}</span>
                  {isOn ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-400" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ onNavigate, className }) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <aside className={cn("flex h-full w-[268px] flex-col bg-[#171a2b]", className)}>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <PulseMark size={34} />
        <div className="leading-none">
          <p className="text-[14.5px] font-bold tracking-tight text-white">
            MPSC <span className="text-brand-300">Pulse</span>
          </p>
          <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/40">
            {t("admin.panel")}
          </p>
        </div>
      </div>

      <AdminNav onNavigate={onNavigate} />

      <div className="space-y-2 border-t border-white/10 p-3">
        <Link
          href="/home"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-white/60 transition hover:bg-white/[0.07] hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Student view
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] p-2.5">
          <Avatar name={user?.name || "Admin"} size="sm" className="bg-brand-500 text-white" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-bold text-white">{user?.name}</p>
            {/* Staff sign in with a username; their internal address is an
                implementation detail and not worth showing. */}
            <p className="truncate text-[10.5px] text-white/45">
              {user?.username ? `@${user.username}` : user?.email}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label={t("common.logout")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AdminHeader({ title, subtitle, breadcrumbs = [], actions, onOpenMenu }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/92 backdrop-blur-lg">
      <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onOpenMenu}
          className="-ml-1 rounded-xl p-2 text-ink transition hover:bg-slate-100 xl:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          {breadcrumbs.length ? (
            <nav className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-muted">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 ? <ChevronRight className="h-3 w-3 opacity-50" /> : null}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-brand-600">
                      {b.label}
                    </Link>
                  ) : (
                    <span>{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
          <h1 className="truncate text-[17px] font-bold tracking-tight text-ink sm:text-xl">
            {title}
          </h1>
          {subtitle ? <p className="truncate text-[12px] text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/admin/audit"
            className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 sm:inline-flex"
          >
            <History className="h-3.5 w-3.5" />
            {t("admin.auditLog")}
          </Link>
          {actions}
        </div>
      </div>
    </header>
  );
}

export function AdminShell({ title, subtitle, breadcrumbs, actions, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-dvh bg-[#f4f5f9]">
      <div className="sticky top-0 hidden h-dvh shrink-0 xl:block">
        <AdminSidebar />
      </div>
      {open ? (
        <div className="fixed inset-0 z-[95] xl:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-fade-up">
            <div className="relative h-full">
              <button
                onClick={() => setOpen(false)}
                className="absolute -right-11 top-3 rounded-xl bg-white/90 p-2 text-ink shadow"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <AdminSidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          actions={actions}
          onOpenMenu={() => setOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export function AdminSearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
      />
    </div>
  );
}

export { Badge, Button };
