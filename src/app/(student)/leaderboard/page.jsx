"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Zap, Medal, TrendingUp } from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { leaderboardService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import {
  Tabs,
  Card,
  Badge,
  Avatar,
  Select,
  SkeletonList,
  EmptyState,
  ErrorState,
  ProgressBar,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const MEDALS = ["#f59e0b", "#94a3b8", "#c2703b"];

export default function LeaderboardPage() {
  const { t, tf } = useI18n();
  const { user } = useAuth();
  const [period, setPeriod] = useState("global");
  const [courseId, setCourseId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    leaderboardService
      .list({ period, ...(courseId ? { courseId } : {}) })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [period, courseId]);

  const top3 = (data?.items || []).slice(0, 3);
  const rest = (data?.items || []).slice(3);

  return (
    <StudentShell title={t("leaderboard.title")}>
      {/* My rank card */}
      {data?.me ? (
        <Card className="overflow-hidden border-0 bg-brand-800 text-white">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <Avatar name={data.me.name} src={data.me.avatarUrl} size="lg" className="bg-white/20 text-white" />
              <span className="absolute -bottom-1 -right-1 rounded-lg bg-white px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                #{data.me.rank}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">
                {t("leaderboard.myRank")}
              </p>
              <p className="truncate text-[17px] font-bold">{data.me.name}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge tone="dark" className="bg-white/15 text-white">
                  L{data.me.levelNumber} · {t(`gamify.levels.${data.me.level}`)}
                </Badge>
                <Badge tone="dark" className="bg-white/15 text-white" icon={Zap}>
                  {data.me.xp} XP
                </Badge>
                <Badge tone="dark" className="bg-white/15 text-white" icon={Flame}>
                  {data.me.streakCurrent}d
                </Badge>
              </div>
            </div>
          </div>
          {data.me.xpToNextRank > 0 ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11.5px] text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t("leaderboard.toNextRank")}
                </span>
                <span className="font-bold text-white">{data.me.xpToNextRank} XP</span>
              </div>
              <ProgressBar
                value={Math.max(6, 100 - Math.min(100, data.me.xpToNextRank / 5))}
                size="sm"
                className="mt-1.5"
                barClassName="bg-accent-400"
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Tabs
          className="flex-1"
          value={period}
          onChange={(v) => {
            setPeriod(v);
            setCourseId("");
          }}
          tabs={[
            { value: "global", label: t("leaderboard.global") },
            { value: "weekly", label: t("leaderboard.weekly") },
            { value: "monthly", label: t("leaderboard.monthly") },
          ]}
        />
        <Select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          placeholder={t("leaderboard.courseWise")}
          options={(data?.courses || []).map((c) => ({ value: c.id, label: tf(c, "title") }))}
          wrapperClassName="w-full sm:w-60"
        />
      </div>

      {error ? (
        <ErrorState className="mt-4" title={t("common.somethingWrong")} description={error} />
      ) : !data ? (
        <SkeletonList rows={6} className="mt-4" />
      ) : data.items.length ? (
        <>
          {/* Podium */}
          {top3.length === 3 ? (
            <div className="mt-5 grid grid-cols-3 items-end gap-2.5">
              {[top3[1], top3[0], top3[2]].map((p, i) => {
                const place = i === 1 ? 0 : i === 0 ? 1 : 2;
                const heights = ["h-24", "h-32", "h-20"];
                return (
                  <div key={p.id} className="flex flex-col items-center">
                    <Avatar name={p.name} src={p.avatarUrl} size={place === 0 ? "lg" : "md"} ring />
                    <p className="mt-2 line-clamp-1 text-center text-[12px] font-bold text-ink">{p.name}</p>
                    <p className="text-[11px] font-bold text-brand-700">{p.periodXp ?? p.xp} XP</p>
                    <div
                      className={cn(
                        "mt-2 flex w-full items-start justify-center rounded-t-2xl pt-2.5",
                        heights[i === 1 ? 1 : i === 0 ? 0 : 2],
                      )}
                      style={{ background: `linear-gradient(180deg, ${MEDALS[place]}33, ${MEDALS[place]}0d)` }}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-white"
                        style={{ background: MEDALS[place] }}
                      >
                        {place + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Ranks */}
          <div className="mt-4 space-y-2">
            {(top3.length === 3 ? rest : data.items).map((r) => {
              const isMe = user && r.id === user.id;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-soft",
                    isMe ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200/80",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12.5px] font-bold",
                      r.rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {r.rank}
                  </span>
                  <Avatar name={r.name} src={r.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-ink">
                      {r.name}
                      {isMe ? <span className="ml-1.5 text-[11px] font-bold text-brand-600">({t("leaderboard.you")})</span> : null}
                    </p>
                    <p className="text-[11px] text-muted">
                      L{r.levelNumber} · {t(`gamify.levels.${r.level}`)}
                      {courseId && r.progressPercent != null ? ` · ${r.progressPercent}%` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-700">
                      <Zap className="h-3.5 w-3.5" />
                      {r.periodXp ?? r.xp}
                    </p>
                    <p className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                      <Flame className="h-3 w-3" />
                      {r.streakCurrent}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="mt-5 bg-slate-50/70">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
              <Medal className="h-4 w-4 text-brand-600" />
              How ranking works
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
              XP comes from completing lectures, attempting tests, answering correctly, finishing
              chapters and courses, and keeping a daily streak — not from watch time alone. All XP is
              awarded and de-duplicated on the server.
            </p>
          </Card>
        </>
      ) : (
        <EmptyState
          className="mt-4"
          icon={Trophy}
          title={t("leaderboard.empty")}
          description={t("leaderboard.emptySub")}
        />
      )}
    </StudentShell>
  );
}
