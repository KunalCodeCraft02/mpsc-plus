"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Video, ClipboardList, Zap } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { Card, SectionHeader, PageLoader, ErrorState, Badge, ProgressBar } from "@/components/ui";
import { LineChart, BarChart, DonutChart } from "@/components/charts/Charts";
import { formatSeconds } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    adminService.analytics().then(setData).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  if (error)
    return (
      <AdminShell title={t("admin.analytics")}>
        <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
      </AdminShell>
    );
  if (!data)
    return (
      <AdminShell title={t("admin.analytics")}>
        <PageLoader />
      </AdminShell>
    );

  return (
    <AdminShell
      title={t("admin.analytics")}
      subtitle="Engagement, completion and test performance across the platform"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.analytics") }]}
    >
      <div className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <SectionHeader title="Enrolment trend" subtitle="New enrolments · last 14 days" icon={TrendingUp} />
            <LineChart data={data.enrollmentTrend} height={210} color="#12b981" />
          </Card>
          <Card>
            <SectionHeader title="XP sources" subtitle="Where learners earn XP" icon={Zap} />
            {data.xpDistribution?.length ? (
              <DonutChart
                segments={data.xpDistribution.slice(0, 5).map((x, i) => ({
                  label: x.label.replace(/_/g, " "),
                  value: x.value,
                  color: ["#5b34e0", "#6c4cf1", "#a3a8ff", "#ff5c7a", "#12b981"][i],
                }))}
                centerValue={data.xpDistribution.reduce((s, x) => s + x.value, 0)}
                centerLabel="XP"
              />
            ) : (
              <p className="py-8 text-center text-[13px] text-muted">{t("common.noResults")}</p>
            )}
          </Card>
        </div>

        <Card>
          <SectionHeader title={t("admin.lectureCompletion")} subtitle="Completion % by course" icon={Video} />
          <BarChart
            data={data.lectureCompletion.map((c) => ({ label: c.label.slice(0, 14), value: c.value }))}
            height={200}
            unit="%"
            color="#5b34e0"
          />
        </Card>

        <Card padded={false}>
          <div className="p-4 pb-0">
            <SectionHeader title={t("admin.quizPerformance")} subtitle="Per-test statistics" icon={ClipboardList} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">{t("common.title")}</th>
                  <th className="px-4 py-3">{t("tests.questions")}</th>
                  <th className="px-4 py-3">{t("admin.attempts")}</th>
                  <th className="px-4 py-3">{t("admin.avgScore")}</th>
                  <th className="px-4 py-3">{t("admin.highest")}</th>
                  <th className="px-4 py-3">{t("admin.lowest")}</th>
                  <th className="px-4 py-3">{t("admin.passRate")}</th>
                  <th className="px-4 py-3">{t("admin.avgTime")}</th>
                </tr>
              </thead>
              <tbody>
                {data.quizStats.map((q) => (
                  <tr key={q.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{q.title}</p>
                      <p className="text-[11px] text-muted">{q.courseTitle}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{q.questionCount}</td>
                    <td className="px-4 py-3 tabular-nums">{q.attempts}</td>
                    <td className="px-4 py-3">
                      <div className="w-28">
                        <ProgressBar value={q.avgScore} size="sm" showLabel />
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-teal-600">{q.highest}%</td>
                    <td className="px-4 py-3 tabular-nums text-accent-600">{q.lowest}%</td>
                    <td className="px-4 py-3">
                      <Badge tone={q.passRate >= 60 ? "success" : q.passRate >= 30 ? "warning" : "danger"}>
                        {q.passRate}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">{formatSeconds(q.avgTimeSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionHeader title={t("admin.hardestQuestions")} subtitle="Highest error rate (most attempted test)" />
          {data.hardest?.length ? (
            <ul className="divide-y divide-slate-50">
              {data.hardest.map((h, i) => (
                <li key={i} className="flex items-start gap-3 py-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-50 text-[11px] font-bold text-accent-600">
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-[13px] text-ink">{h.text}</p>
                  <Badge tone="danger">{h.errorRate}%</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-[13px] text-muted">
              No attempt data yet — question-level analysis appears after students submit tests.
            </p>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
