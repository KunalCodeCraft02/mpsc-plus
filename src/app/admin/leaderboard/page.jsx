"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Zap } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { leaderboardService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { Card, SectionHeader, Tabs, Avatar, Badge, PageLoader, Select, EmptyState } from "@/components/ui";

export default function AdminLeaderboardPage() {
  const { t, tf } = useI18n();
  const [period, setPeriod] = useState("global");
  const [courseId, setCourseId] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    leaderboardService
      .list({ period, ...(courseId ? { courseId } : {}) })
      .then(setData)
      .catch(() => setData({ items: [], courses: [] }));
  }, [period, courseId]);

  return (
    <AdminShell
      title={t("admin.leaderboard")}
      subtitle="Ranking blends XP from lectures, tests, course completion and consistency"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.leaderboard") }]}
    >
      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Tabs
            value={period}
            onChange={setPeriod}
            tabs={[
              { value: "global", label: t("leaderboard.global") },
              { value: "weekly", label: t("leaderboard.weekly") },
              { value: "monthly", label: t("leaderboard.monthly") },
            ]}
          />
          <Select
            label={t("leaderboard.courseWise")}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder={t("common.all")}
            options={(data?.courses || []).map((c) => ({ value: c.id, label: tf(c, "title") }))}
            wrapperClassName="w-full sm:w-64"
          />
        </div>

        {!data ? (
          <PageLoader />
        ) : !data.items.length ? (
          <EmptyState icon={Trophy} title={t("leaderboard.empty")} description={t("leaderboard.emptySub")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t("common.students")}</th>
                  <th className="px-4 py-3">{t("home.level")}</th>
                  <th className="px-4 py-3">XP</th>
                  <th className="px-4 py-3">{t("profile.currentStreak")}</th>
                  {courseId ? <th className="px-4 py-3">{t("learning.progress")}</th> : null}
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-bold ${
                          r.rank === 1
                            ? "bg-amber-100 text-amber-700"
                            : r.rank === 2
                              ? "bg-slate-200 text-slate-700"
                              : r.rank === 3
                                ? "bg-orange-100 text-orange-700"
                                : "text-muted"
                        }`}
                      >
                        {r.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.name} src={r.avatarUrl} size="sm" />
                        <span className="font-semibold text-ink">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="brand">L{r.levelNumber} · {t(`gamify.levels.${r.level}`)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-brand-700">
                        <Zap className="h-3.5 w-3.5" />
                        {r.periodXp ?? r.xp}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <Flame className="h-3.5 w-3.5" />
                        {r.streakCurrent}
                      </span>
                    </td>
                    {courseId ? (
                      <td className="px-4 py-3 tabular-nums text-muted">{r.progressPercent ?? 0}%</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
