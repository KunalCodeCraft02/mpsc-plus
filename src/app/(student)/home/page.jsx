"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Zap,
  PlayCircle,
  ClipboardCheck,
  GraduationCap,
  ArrowRight,
  Target,
  FileText,
  Bell,
} from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { learningService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  SectionHeader,
  Badge,
  Button,
  ProgressBar,
  RingProgress,
  SkeletonCard,
  SkeletonList,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { CourseCard, QuizCard, ActivityRow } from "@/components/cards/ContentCards";
import { HeatStrip } from "@/components/charts/Charts";
import { formatDuration } from "@/lib/utils";

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "home.greetingMorning";
  if (h < 17) return "home.greetingAfternoon";
  return "home.greetingEvening";
}

export default function HomePage() {
  const { t, tf } = useI18n();
  const { user, level } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    learningService.dashboard().then(setData).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const firstName = (user?.name || "").split(" ")[0];

  return (
    <StudentShell>
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-4 text-white shadow-pop sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-white/70">{t(greetingKey())},</p>
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{firstName} 👋</h1>
            <p className="mt-1 text-[13px] text-white/70">{t("home.subline")}</p>
          </div>
          <RingProgress value={level.progress} size={64} stroke={6} tone="#ff9db2">
            <div className="text-center">
              <p className="text-[15px] font-bold leading-none">L{level.number}</p>
              <p className="mt-0.5 text-[8.5px] font-bold uppercase tracking-wide text-white/70">
                {t(`gamify.levels.${level.key}`)}
              </p>
            </div>
          </RingProgress>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-white/12 p-2.5 text-center">
            <Flame className="mx-auto h-4 w-4 text-accent-300" />
            <p className="mt-1 text-lg font-bold leading-none">{user?.streakCurrent || 0}</p>
            <p className="text-[9.5px] font-bold uppercase tracking-wide text-white/60">{t("home.streak")}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-2.5 text-center">
            <Zap className="mx-auto h-4 w-4 text-amber-300" />
            <p className="mt-1 text-lg font-bold leading-none">{user?.xp || 0}</p>
            <p className="text-[9.5px] font-bold uppercase tracking-wide text-white/60">{t("home.xp")}</p>
          </div>
        </div>

        {level.nextAt ? (
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <span>{t("home.toNextLevel")}</span>
              <span className="font-bold">{level.toNext} XP</span>
            </div>
            <ProgressBar value={level.progress} size="sm" className="mt-1.5" barClassName="bg-accent-400" />
          </div>
        ) : null}
      </section>

      {error ? (
        <ErrorState className="mt-5" title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
      ) : null}

      {/* Quick actions */}
      <section className="mt-5">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { href: "/courses", icon: GraduationCap, label: t("nav.courses"), tone: "bg-brand-50 text-brand-600" },
            { href: "/tests", icon: ClipboardCheck, label: t("nav.tests"), tone: "bg-teal-50 text-teal-600" },
            { href: "/materials", icon: FileText, label: t("nav.downloads"), tone: "bg-accent-50 text-accent-600" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 text-center shadow-soft transition hover:shadow-card"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[12px] font-bold leading-tight text-ink">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {!data ? (
        <div className="mt-6 space-y-5">
          <SkeletonList rows={2} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Continue learning */}
          <section className="mt-6">
            <SectionHeader
              title={t("home.continueLearning")}
              icon={PlayCircle}
              action={
                <Link href="/my-learning" className="text-[12.5px] font-bold text-brand-600 hover:underline">
                  {t("common.viewAll")}
                </Link>
              }
            />
            {data.continueLearning.length ? (
              <div className="space-y-2.5">
                {data.continueLearning.map((l) => (
                  <Link
                    key={l.lectureId}
                    href={`/lectures/${l.lectureId}`}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-soft transition hover:border-brand-200 hover:shadow-card"
                  >
                    <div className="relative w-24 shrink-0 overflow-hidden rounded-xl sm:w-32">
                      <div className="aspect-video bg-ink">
                        {l.youtubeId ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`https://i.ytimg.com/vi/${l.youtubeId}/mqdefault.jpg`} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : null}
                      </div>
                      <PlayCircle className="absolute inset-0 m-auto h-7 w-7 text-white/90 drop-shadow" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13.5px] font-bold leading-snug text-ink group-hover:text-brand-700">
                        {tf(l, "title")}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted">{tf({ title: l.courseTitle, titleMr: l.courseTitleMr }, "title")}</p>
                      <ProgressBar value={l.percent} size="sm" className="mt-2" tone="accent" showLabel />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={PlayCircle}
                title={t("home.noEnrollments")}
                description={t("home.noEnrollmentsSub")}
                action={
                  <Button as={Link} href="/courses" rightIcon={ArrowRight}>
                    {t("home.exploreCourses")}
                  </Button>
                }
              />
            )}
          </section>

          {/* Weekly activity + goal */}
          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <SectionHeader title={t("profile.weeklyActivity")} subtitle="XP earned each day" />
              <HeatStrip
                days={(data.weekly || []).map((d) => ({
                  label: new Date(d.day).toLocaleDateString("en", { weekday: "narrow" }),
                  value: d.xp,
                }))}
              />
            </Card>
            <Card className="flex flex-col justify-between bg-gradient-to-br from-teal-50 to-white">
              <div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white">
                  <Target className="h-5 w-5" />
                </span>
                <p className="mt-3 text-[13px] font-bold uppercase tracking-wide text-teal-700">
                  {t("home.todayGoal")}
                </p>
                <p className="mt-1 text-[14.5px] font-bold text-ink">{t("home.goalBody")}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button as={Link} href="/my-learning" size="sm" variant="success">
                  {t("learning.continue")}
                </Button>
                <Button as={Link} href="/tests" size="sm" variant="outline">
                  {t("nav.tests")}
                </Button>
              </div>
            </Card>
          </section>

          {/* My courses */}
          {data.myCourses.length ? (
            <section className="mt-6">
              <SectionHeader
                title={t("home.myCourses")}
                icon={GraduationCap}
                action={
                  <Link href="/my-learning" className="text-[12.5px] font-bold text-brand-600 hover:underline">
                    {t("common.viewAll")}
                  </Link>
                }
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.myCourses.slice(0, 3).map((c) => (
                  <CourseCard
                    key={c.courseId}
                    course={{ ...c, id: c.courseId }}
                    progress={c.progressPercent}
                    variant="row"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Upcoming tests */}
          <section className="mt-6">
            <SectionHeader
              title={t("home.upcomingTests")}
              icon={ClipboardCheck}
              action={
                <Link href="/tests" className="text-[12.5px] font-bold text-brand-600 hover:underline">
                  {t("common.viewAll")}
                </Link>
              }
            />
            {data.upcomingTests.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.upcomingTests.slice(0, 4).map((q) => (
                  <QuizCard key={q.id} quiz={q} />
                ))}
              </div>
            ) : (
              <EmptyState compact icon={ClipboardCheck} title={t("tests.empty")} description={t("tests.emptySub")} />
            )}
          </section>

          {/* Recommended */}
          {data.recommended.length ? (
            <section className="mt-6">
              <SectionHeader title={t("home.recommended")} icon={GraduationCap} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {data.recommended.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Recent activity + notifications */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionHeader title={t("learning.activity")} />
              <div className="divide-y divide-slate-50">
                {data.recentLectures.length ? (
                  data.recentLectures.map((l) => (
                    <ActivityRow
                      key={l.lectureId}
                      icon={PlayCircle}
                      title={tf(l, "title")}
                      meta={`${l.courseTitle} · ${formatDuration(l.durationMin)}`}
                      right={
                        l.completed ? (
                          <Badge tone="success">{t("lecture.completed")}</Badge>
                        ) : (
                          <Badge tone="outline">{l.percent}%</Badge>
                        )
                      }
                    />
                  ))
                ) : (
                  <p className="py-6 text-center text-[13px] text-muted">{t("learning.emptySub")}</p>
                )}
              </div>
            </Card>
            <Card>
              <SectionHeader
                title={t("notifications.title")}
                icon={Bell}
                action={
                  <Link href="/notifications" className="text-[12.5px] font-bold text-brand-600 hover:underline">
                    {t("common.viewAll")}
                  </Link>
                }
              />
              <div className="divide-y divide-slate-50">
                {(data.notifications || []).map((n) => (
                  <div key={n.id} className="py-2.5">
                    <p className="text-[13px] font-semibold text-ink">{tf(n, "title")}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted">{tf(n, "body")}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </>
      )}
    </StudentShell>
  );
}
