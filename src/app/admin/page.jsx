"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Video,
  FileText,
  ClipboardList,
  Activity,
  TrendingUp,
  Plus,
  History,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import {
  Button,
  Badge,
  Card,
  SectionHeader,
  Skeleton,
  ErrorState,
  Avatar,
  ProgressBar,
  StatusBadge,
} from "@/components/ui";
import { LineChart, BarChart, DonutChart } from "@/components/charts/Charts";
import { formatDate, formatDuration } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, sub, tone = "brand", href }) {
  const tones = {
    brand: "from-brand-500 to-brand-700",
    accent: "from-accent-400 to-accent-600",
    teal: "from-teal-500 to-teal-600",
    amber: "from-amber-400 to-amber-600",
    ink: "from-slate-700 to-slate-900",
    violet: "from-violet-500 to-violet-700",
  };
  const Wrapper = href ? Link : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft transition hover:shadow-card"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-bold leading-none tracking-tight text-ink">{value}</p>
          {sub ? <p className="mt-1.5 text-[11.5px] text-muted">{sub}</p> : null}
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Wrapper>
  );
}

export default function AdminDashboard() {
  const { t, tf } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    adminService
      .stats()
      .then(setData)
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  return (
    <AdminShell
      title={t("admin.dashboard")}
      subtitle="Platform health, content and learner activity at a glance"
      actions={
        <Button as={Link} href="/admin/courses" size="md" leftIcon={Plus}>
          {t("admin.newCourse")}
        </Button>
      }
    >
      {error ? (
        <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
      ) : !data ? (
        <div className="space-y-4">
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Cards */}
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard icon={Users} label={t("admin.totalStudents")} value={data.cards.students} sub={`${data.cards.enrollments} enrolments`} href="/admin/students" />
            <StatCard icon={Activity} label={t("admin.activeStudents")} value={data.cards.activeStudents} sub="last 7 days" tone="teal" />
            <StatCard icon={GraduationCap} label={t("admin.totalCourses")} value={data.cards.courses} sub={`${data.cards.coursesPublished} ${t("common.published").toLowerCase()}`} tone="violet" href="/admin/courses" />
            <StatCard icon={Video} label={t("admin.totalLectures")} value={data.cards.lectures} sub={`${data.cards.lecturesPublished} live`} tone="accent" href="/admin/lectures" />
            <StatCard icon={FileText} label={t("admin.totalPdfs")} value={data.cards.pdfs} sub={`${data.cards.pdfsPublished} live`} tone="amber" href="/admin/pdfs" />
            <StatCard icon={ClipboardList} label={t("admin.totalQuizzes")} value={data.cards.quizzes} sub={`${data.cards.attempts} attempts`} tone="ink" href="/admin/quizzes" />
          </div>

          {/* Charts */}
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <SectionHeader title={t("admin.studentGrowth")} subtitle="Cumulative registrations · last 14 days" icon={TrendingUp} />
              <LineChart data={data.growth} height={210} />
            </Card>
            <Card>
              <SectionHeader title={t("admin.courseEngagement")} subtitle="Lecture views per course" />
              {data.engagement.length ? (
                <DonutChart
                  segments={data.engagement.slice(0, 5).map((e, i) => ({
                    label: e.label,
                    value: e.value,
                    color: ["#5b34e0", "#6c4cf1", "#a3a8ff", "#ff5c7a", "#12b981"][i],
                  }))}
                  centerValue={data.engagement.reduce((s, e) => s + e.value, 0)}
                  centerLabel="views"
                />
              ) : (
                <p className="py-8 text-center text-[13px] text-muted">{t("common.noResults")}</p>
              )}
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <SectionHeader title={t("admin.quizPerformance")} subtitle="Average score % by test" />
              <BarChart data={data.quizPerformance.map((q) => ({ label: q.label.slice(0, 12), value: q.value }))} height={190} unit="%" />
            </Card>
            <Card>
              <SectionHeader
                title={t("admin.popularCourses")}
                action={
                  <Link href="/admin/courses" className="text-[12px] font-bold text-brand-600 hover:underline">
                    {t("common.viewAll")}
                  </Link>
                }
              />
              <div className="space-y-3">
                {data.topCourses.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/courses/${c.id}`} className="truncate text-[13px] font-semibold text-ink hover:text-brand-700">
                        {tf(c, "title")}
                      </Link>
                      <ProgressBar
                        value={Math.min(100, (c.students / Math.max(1, data.topCourses[0].students || 1)) * 100)}
                        size="sm"
                        className="mt-1.5"
                      />
                    </div>
                    <Badge tone="brand">{c.students}</Badge>
                    <StatusBadge published={c.published} labels={{ published: t("common.published"), draft: t("common.draft") }} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Lists */}
          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <SectionHeader
                title={t("admin.recentStudents")}
                action={
                  <Link href="/admin/students" className="text-[12px] font-bold text-brand-600 hover:underline">
                    {t("common.viewAll")}
                  </Link>
                }
              />
              <div className="divide-y divide-slate-50">
                {data.recentStudents.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 py-2.5">
                    <Avatar name={s.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{s.name}</p>
                      <p className="truncate text-[11px] text-muted">{s.email}</p>
                    </div>
                    <span className="shrink-0 text-[11.5px] font-bold text-brand-700">{s.xp} XP</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader title={t("admin.recentContent")} action={<Link href="/admin/lectures" className="text-[12px] font-bold text-brand-600 hover:underline">{t("common.viewAll")}</Link>} />
              <div className="divide-y divide-slate-50">
                {data.recentLectures.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Video className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{l.title}</p>
                      <p className="truncate text-[11px] text-muted">{l.courseTitle} · {formatDuration(l.durationMin)}</p>
                    </div>
                    <StatusBadge published={l.published} labels={{ published: t("common.published"), draft: t("common.draft") }} />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader title={t("admin.recentQuizActivity")} action={<Link href="/admin/analytics" className="text-[12px] font-bold text-brand-600 hover:underline">{t("common.viewAll")}</Link>} />
              <div className="divide-y divide-slate-50">
                {data.recentAttempts.length ? (
                  data.recentAttempts.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 py-2.5">
                      <Avatar name={a.studentName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{a.studentName}</p>
                        <p className="truncate text-[11px] text-muted">{a.quizTitle}</p>
                      </div>
                      <Badge tone={a.passed ? "success" : "danger"}>{a.percent}%</Badge>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-[13px] text-muted">{t("common.noResults")}</p>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <SectionHeader title={t("admin.auditLog")} icon={History} action={<Link href="/admin/audit" className="text-[12px] font-bold text-brand-600 hover:underline">{t("common.viewAll")}</Link>} />
            <div className="divide-y divide-slate-50">
              {data.audit.map((a) => (
                <div key={a.id} className="py-2.5">
                  <div className="flex items-center gap-2">
                    <Badge tone="outline" size="sm">{a.action}</Badge>
                    <span className="truncate text-[12.5px] font-semibold text-ink">{a.adminName}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted">{formatDate(a.createdAt)}</span>
                  </div>
                  <p className="mt-1 truncate text-[11.5px] text-muted">{a.detail}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
