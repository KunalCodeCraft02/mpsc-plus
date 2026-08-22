"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home,
  BookMarked,
  ClipboardCheck,
  Trophy,
  User,
  Search,
  Bell,
  Flame,
  Zap,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Avatar, Badge, Button } from "@/components/ui";
import { BrandLock, PulseMark } from "./Brand";

const TABS = [
  { key: "home", href: "/home", icon: Home },
  { key: "myLearning", href: "/my-learning", icon: BookMarked },
  { key: "tests", href: "/tests", icon: ClipboardCheck },
  { key: "leaderboard", href: "/leaderboard", icon: Trophy },
  { key: "profile", href: "/profile", icon: User },
];

const SIDE_LINKS = [
  { key: "home", href: "/home", icon: Home },
  { key: "courses", href: "/courses", icon: GraduationCap },
  { key: "myLearning", href: "/my-learning", icon: BookMarked },
  { key: "tests", href: "/tests", icon: ClipboardCheck },
  { key: "downloads", href: "/materials", icon: FileText },
  { key: "leaderboard", href: "/leaderboard", icon: Trophy },
  { key: "profile", href: "/profile", icon: User },
  { key: "support", href: "/support", icon: FileText },
  { key: "settings", href: "/settings", icon: Settings },
];

function isActive(pathname, href) {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ------------------------------ Bottom nav ---------------------------- */
export function BottomNavigation() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1.5">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="group relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5"
            >
              <span
                className={cn(
                  "flex h-8 w-full max-w-[52px] items-center justify-center rounded-lg transition-all",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-400 group-active:bg-slate-100",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-semibold leading-none",
                  active ? "text-brand-700" : "text-slate-400",
                )}
              >
                {t(`nav.${tab.key}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* -------------------------------- Sidebar ----------------------------- */
export function Sidebar({ onNavigate, mobile = false }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, level, logout } = useAuth();
  const router = useRouter();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-200 bg-white",
        mobile ? "w-72" : "w-64",
      )}
    >
      <div className={cn("px-5 py-5", mobile && "pt-[calc(1.25rem+var(--sat))]")}>
        <Link href="/home" onClick={onNavigate}>
          <BrandLock size={38} />
        </Link>
      </div>

      {user ? (
        <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" className="bg-white/20 text-white" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold">{user.name}</p>
              <p className="text-[11px] text-white/70">
                {t(`gamify.levels.${level.key}`)} · L{level.number}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold">
              <Zap className="h-3 w-3" />
              {user.xp || 0} XP
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold">
              <Flame className="h-3 w-3" />
              {user.streakCurrent || 0}d
            </span>
          </div>
        </div>
      ) : null}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {SIDE_LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.key}
              href={l.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-ink",
              )}
            >
              <Icon className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
              {t(`nav.${l.key}`)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        {user ? (
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
            {t("common.logout")}
          </button>
        ) : (
          <Button as={Link} href="/login" fullWidth size="sm">
            {t("welcome.login")}
          </Button>
        )}
      </div>
    </aside>
  );
}

/* -------------------------------- Header ------------------------------ */
export function Header({ title, showSearch = true, back = false }) {
  const { t } = useI18n();
  const { user, level } = useAuth();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  return (
    <>
      <header className="safe-top sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:px-5 lg:h-16">
          <button
            onClick={() => setDrawer(true)}
            className="-ml-1 rounded-xl p-2 text-ink transition hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {title ? (
            <h1 className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight text-ink lg:text-lg">
              {title}
            </h1>
          ) : (
            <Link href="/home" className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
              <PulseMark size={28} />
              <span className="truncate text-[15px] font-bold tracking-tight">
                MPSC <span className="text-brand-600">Pulse</span>
              </span>
            </Link>
          )}

          {showSearch ? (
            <button
              onClick={() => router.push("/search")}
              className="hidden h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-left text-[13px] text-slate-400 transition hover:border-brand-300 hover:bg-white lg:flex lg:max-w-md"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("search.placeholder")}</span>
            </button>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
            {showSearch ? (
              <Link
                href="/search"
                className="rounded-xl p-2 text-ink transition hover:bg-slate-100 lg:hidden"
                aria-label={t("common.search")}
              >
                <Search className="h-5 w-5" />
              </Link>
            ) : null}
            <Link
              href="/notifications"
              className="relative rounded-xl p-2 text-ink transition hover:bg-slate-100"
              aria-label={t("notifications.title")}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
            </Link>
            {user ? (
              <>
                <span className="ml-1 hidden items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1.5 text-[12px] font-bold text-amber-700 sm:inline-flex">
                  <Flame className="h-3.5 w-3.5" />
                  {user.streakCurrent || 0}
                </span>
                <span className="hidden items-center gap-1.5 rounded-xl bg-brand-50 px-2.5 py-1.5 text-[12px] font-bold text-brand-700 sm:inline-flex">
                  <Zap className="h-3.5 w-3.5" />
                  {user.xp || 0}
                </span>
                <Link href="/profile" className="ml-1 hidden lg:block">
                  <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                </Link>
              </>
            ) : (
              <Button as={Link} href="/login" size="sm" className="ml-1">
                {t("welcome.login")}
              </Button>
            )}
          </div>
        </div>
      </header>

      {drawer ? (
        <div className="fixed inset-0 z-[95] lg:hidden">
          <div className="absolute inset-0 bg-ink/45" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 animate-fade-up">
            <div className="relative h-full">
              <button
                onClick={() => setDrawer(false)}
                className="absolute -right-11 top-[calc(0.75rem+var(--sat))] rounded-xl bg-white/90 p-2 text-ink shadow"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <Sidebar mobile onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ------------------------------ App frame ----------------------------- */
export function StudentShell({ children, title, showSearch = true, hideBottomNav = false, wide = false }) {
  return (
    <div className="flex min-h-dvh bg-[#f6f7fb]">
      <div className="sticky top-0 hidden h-dvh shrink-0 lg:block">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} showSearch={showSearch} />
        <main
          className={cn(
            "mx-auto w-full flex-1 px-3 pb-24 pt-4 sm:px-5 lg:pb-10",
            wide ? "max-w-7xl" : "max-w-6xl",
          )}
        >
          {children}
        </main>
        {!hideBottomNav ? <BottomNavigation /> : null}
      </div>
    </div>
  );
}

export function LevelPill({ className }) {
  const { level } = useAuth();
  const { t } = useI18n();
  return (
    <Badge tone="brand" className={className}>
      L{level.number} · {t(`gamify.levels.${level.key}`)}
    </Badge>
  );
}
