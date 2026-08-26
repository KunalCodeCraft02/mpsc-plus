"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  Globe,
  Flame,
  Zap,
  GraduationCap,
  PlayCircle,
  ClipboardCheck,
  Target,
  Settings,
  Award,
  Sparkles,
  BookOpen,
  Clock,
} from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { learningService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  Badge,
  Button,
  Avatar,
  StatTile,
  SectionHeader,
  RingProgress,
  ProgressBar,
  SkeletonList,
  EmptyState,
} from "@/components/ui";
import { BarChart, LineChart, HeatStrip } from "@/components/charts/Charts";
import { BADGES } from "@/lib/config";
import { formatDate, formatDuration } from "@/lib/utils";

const BADGE_ICONS = {
  first_lecture: PlayCircle,
  streak_7: Flame,
  quiz_master: Target,
  perfect_score: Sparkles,
  bookworm: BookOpen,
  course_completed: GraduationCap,
};

export default function ProfilePage() {
  const { t, tf } = useI18n();
  const { user, level } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    learningService.analytics().then(setData).catch(() => setData(null));
  }, []);

  const earned = new Set((data?.badges || []).map((b) => b.code));
  const stats = user?.stats || {};

  return (
    <StudentShell title={t("profile.title")}>
      {/* Identity */}
      <Card className="overflow-hidden border-0 bg-brand-800 text-white">
        <div className="flex items-start gap-4">
          <Avatar name={user?.name} src={user?.avatarUrl} size="xl" className="bg-white/20 text-white" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight">{user?.name}</h1>
            <div className="mt-1.5 space-y-0.5 text-[12.5px] text-white/70">
              <p className="flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {user?.email}
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {user?.mobile}
              </p>
              <p className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {user?.language === "mr" ? "मराठी" : "English"}
              </p>
            </div>
          </div>
          <RingProgress value={level.progress} size={72} stroke={7} tone="#ff9db2">
            <div className="text-center">
              <p className="text-[16px] font-bold leading-none">L{level.number}</p>
              <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-white/70">
                {t(`gamify.levels.${level.key}`)}
              </p>
            </div>
          </RingProgress>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-white/12 p-2.5 text-center">
            <Zap className="mx-auto h-4 w-4 text-amber-300" />
            <p className="mt-1 text-lg font-bold leading-none">{user?.xp || 0}</p>
            <p className="text-[9.5px] font-bold uppercase tracking-wide text-white/60">{t("home.xp")}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-2.5 text-center">
            <Flame className="mx-auto h-4 w-4 text-accent-300" />
            <p className="mt-1 text-lg font-bold leading-none">{user?.streakCurrent || 0}</p>
            <p className="text-[9.5px] font-bold uppercase tracking-wide text-white/60">{t("profile.currentStreak")}</p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between text-[11.5px] text-white/65">
          <span>
            {t("profile.longestStreak")}: <strong className="text-white">{user?.streakLongest || 0}d</strong>
          </span>
          <span>
            {t("profile.memberSince")} {formatDate(user?.createdAt)}
          </span>
        </div>

        <Button
          as={Link}
          href="/settings"
          variant="outline"
          size="sm"
          className="mt-4 border-white/30 bg-white/10 text-white hover:bg-white/20"
          leftIcon={Settings}
        >
          {t("settings.title")}
        </Button>
      </Card>

      {/* Statistics */}
      <div className="mt-4">
        <SectionHeader title={t("profile.stats")} icon={Target} />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatTile icon={GraduationCap} label={t("profile.coursesCompleted")} value={stats.coursesCompleted ?? 0} />
          <StatTile icon={PlayCircle} label={t("profile.lecturesCompleted")} value={stats.lecturesCompleted ?? 0} tone="accent" />
          <StatTile icon={ClipboardCheck} label={t("profile.quizzesAttempted")} value={stats.quizzesAttempted ?? 0} tone="teal" />
          <StatTile icon={Target} label={t("profile.avgScore")} value={`${stats.avgScore ?? 0}%`} tone="amber" />
        </div>
      </div>

      {/* Badges */}
      <div className="mt-6">
        <SectionHeader
          title={t("profile.badges")}
          icon={Award}
          subtitle={`${earned.size}/${BADGES.length}`}
        />
        {BADGES.length ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
            {BADGES.map((b) => {
              const Icon = BADGE_ICONS[b.code] || Award;
              const got = earned.has(b.code);
              return (
                <div
                  key={b.code}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${
                    got ? "border-brand-200 bg-white shadow-soft" : "border-dashed border-slate-200 bg-slate-50/60"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      got ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className={`text-[11px] font-bold leading-tight ${got ? "text-ink" : "text-slate-400"}`}>
                    {t(`gamify.badges.${b.code}`)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState compact icon={Award} title={t("profile.noBadges")} />
        )}
      </div>

      {/* Analytics */}
      <div className="mt-6">
        <SectionHeader title={t("profile.analytics")} icon={Zap} />
        {!data ? (
          <SkeletonList rows={3} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionHeader title={t("profile.weeklyActivity")} subtitle="XP per day" className="mb-2.5" />
              <HeatStrip
                days={data.weekly.map((d) => ({
                  label: new Date(d.day).toLocaleDateString("en", { weekday: "narrow" }),
                  value: d.xp,
                }))}
              />
            </Card>
            <Card>
              <SectionHeader
                title={t("profile.studyTime")}
                subtitle={`${formatDuration(data.weekly.reduce((s, d) => s + d.minutes, 0))} this week`}
                icon={Clock}
                className="mb-2.5"
              />
              <BarChart
                data={data.weekly.map((d) => ({
                  label: new Date(d.day).toLocaleDateString("en", { weekday: "narrow" }),
                  value: d.minutes,
                }))}
                height={150}
                unit="m"
                color="#12b981"
              />
            </Card>
            <Card>
              <SectionHeader title="Test scores" subtitle="Recent attempts %" className="mb-2.5" />
              {data.scores.length ? (
                <LineChart
                  data={data.scores.map((s, i) => ({ label: `#${i + 1}`, value: s.percent }))}
                  height={150}
                  color="#f83b60"
                />
              ) : (
                <p className="py-8 text-center text-[13px] text-muted">{t("tests.emptySub")}</p>
              )}
            </Card>
            <Card>
              <SectionHeader title="Course progress" className="mb-2.5" />
              {data.courseProgress.length ? (
                <div className="space-y-3">
                  {data.courseProgress.map((c) => (
                    <div key={c.courseId}>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <Link href={`/courses/${c.courseId}`} className="min-w-0 flex-1 truncate font-semibold text-ink hover:text-brand-700">
                          {tf(c, "title")}
                        </Link>
                        <span className="ml-2 shrink-0 font-bold text-brand-700">{c.progressPercent}%</span>
                      </div>
                      <ProgressBar value={c.progressPercent} size="sm" className="mt-1.5" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-[13px] text-muted">{t("learning.emptySub")}</p>
              )}
            </Card>
            {data.xpBreakdown?.length ? (
              <Card className="lg:col-span-2">
                <SectionHeader title={t("profile.xpHistory")} subtitle="XP by activity type" className="mb-2.5" />
                <div className="flex flex-wrap gap-2">
                  {data.xpBreakdown.map((x) => (
                    <Badge key={x.kind} tone="brand">
                      {x.kind.replace(/_/g, " ")}: {x.total} XP
                    </Badge>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </StudentShell>
  );
}
