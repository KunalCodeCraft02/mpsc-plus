"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Trophy,
  XCircle,
  CheckCircle2,
  MinusCircle,
  Clock,
  Target,
  Lightbulb,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { learningService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import {
  Card,
  Badge,
  Button,
  RingProgress,
  StatTile,
  SectionHeader,
  Tabs,
  PageLoader,
  ErrorState,
} from "@/components/ui";
import { DonutChart } from "@/components/charts/Charts";
import { cn, formatSeconds } from "@/lib/utils";

export default function ResultPage() {
  const { id } = useParams();
  const { t, tf } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    learningService
      .attempt(id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <StudentShell title={t("result.title")}>
        <ErrorState title={t("common.somethingWrong")} description={error} />
      </StudentShell>
    );
  }
  if (!data) {
    return (
      <StudentShell title={t("result.title")}>
        <PageLoader />
      </StudentShell>
    );
  }

  const { attempt, quiz } = data;
  const review = attempt.review || [];
  const filtered =
    filter === "all" ? review : review.filter((r) => r.state === filter);

  return (
    <StudentShell title={t("result.title")}>
      {/* Score hero */}
      <Card
        className={cn(
          "overflow-hidden border-0 bg-gradient-to-br text-white",
          attempt.passed ? "from-teal-500 to-teal-700" : "from-slate-600 to-slate-800",
        )}
      >
        <div className="flex items-center gap-5">
          <RingProgress value={attempt.percent} size={96} stroke={9} tone="#ffffff">
            <div className="text-center">
              <p className="text-2xl font-bold leading-none">{attempt.percent}%</p>
              <p className="text-[9px] font-bold uppercase tracking-wide text-white/70">
                {t("result.percentage")}
              </p>
            </div>
          </RingProgress>
          <div className="min-w-0 flex-1">
            <Badge tone="dark" className="bg-white/20 text-white">
              {attempt.passed ? t("result.passed") : t("result.failed")}
            </Badge>
            <p className="mt-2 truncate text-[16px] font-bold leading-tight">{tf(quiz, "title")}</p>
            <p className="mt-1 text-[13px] text-white/75">
              {t("result.score")}: <span className="font-bold">{attempt.score}</span> / {attempt.totalMarks}
            </p>
            <p className="mt-0.5 text-[11.5px] text-white/60">
              {t("tests.passing")} {quiz?.passingPercent}% · {t("result.timeTaken")} {formatSeconds(attempt.timeTakenSec)}
            </p>
          </div>
        </div>
      </Card>

      {/* Breakdown */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile icon={CheckCircle2} label={t("result.correct")} value={attempt.correct} tone="teal" />
        <StatTile icon={XCircle} label={t("result.incorrect")} value={attempt.incorrect} tone="accent" />
        <StatTile icon={MinusCircle} label={t("result.unanswered")} value={attempt.unanswered} tone="slate" />
        <StatTile icon={Clock} label={t("result.timeTaken")} value={formatSeconds(attempt.timeTakenSec)} tone="brand" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionHeader title={t("result.analysis")} icon={Target} />
          <DonutChart
            segments={[
              { label: t("result.correct"), value: attempt.correct, color: "#12b981" },
              { label: t("result.incorrect"), value: attempt.incorrect, color: "#f83b60" },
              { label: t("result.unanswered"), value: attempt.unanswered, color: "#cbd5e1" },
            ]}
            centerValue={review.length}
            centerLabel={t("tests.questions")}
            size={132}
          />
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeader title={t("result.xpEarned")} icon={Zap} />
          <div className="flex flex-wrap gap-2.5">
            <div className="flex-1 rounded-xl bg-brand-50 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">Attempt</p>
              <p className="mt-1 text-lg font-bold text-brand-800">+5 XP</p>
            </div>
            <div className="flex-1 rounded-xl bg-teal-50 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-teal-600">
                {t("result.correct")} × 10
              </p>
              <p className="mt-1 text-lg font-bold text-teal-700">+{attempt.correct * 10} XP</p>
            </div>
            {attempt.percent >= 80 ? (
              <div className="flex-1 rounded-xl bg-amber-50 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">High score</p>
                <p className="mt-1 text-lg font-bold text-amber-700">
                  +{attempt.percent >= 100 ? 75 : 25} XP
                </p>
              </div>
            ) : null}
          </div>
          <p className="mt-3 text-[11.5px] text-muted">
            XP is calculated and stored on the server from this verified attempt.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button as={Link} href="/tests" variant="outline" size="sm" leftIcon={ArrowLeft}>
              {t("result.backToTests")}
            </Button>
            <Button as={Link} href={`/tests/${quiz?.id}`} size="sm">
              {t("tests.retake")}
            </Button>
            <Button as={Link} href="/leaderboard" variant="secondary" size="sm" leftIcon={Trophy}>
              {t("leaderboard.title")}
            </Button>
          </div>
        </Card>
      </div>

      {/* Question analysis */}
      <div className="mt-6">
        <SectionHeader title={t("result.analysis")} subtitle={`${review.length} ${t("tests.questions")}`} />
        <Tabs
          className="mb-3"
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: t("common.all"), count: review.length },
            { value: "correct", label: t("result.correct"), count: attempt.correct },
            { value: "incorrect", label: t("result.incorrect"), count: attempt.incorrect },
            { value: "unanswered", label: t("result.skipped"), count: attempt.unanswered },
          ]}
        />
        <div className="space-y-3">
          {filtered.map((r, i) => (
            <Card key={r.questionId}>
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold",
                    r.state === "correct"
                      ? "bg-teal-100 text-teal-700"
                      : r.state === "incorrect"
                        ? "bg-red-100 text-red-600"
                        : "bg-slate-100 text-slate-500",
                  )}
                >
                  {r.orderIndex || i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold leading-relaxed text-ink">
                    {tf({ text: r.text, textMr: r.textMr }, "text")}
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {(tf({ options: r.options, optionsMr: r.optionsMr }, "options") || []).map((opt, oi) => {
                      const isCorrect = oi === r.correctIndex;
                      const isSelected = oi === r.selectedIndex;
                      return (
                        <div
                          key={oi}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border p-2.5 text-[13.5px]",
                            isCorrect
                              ? "border-teal-300 bg-teal-50 text-teal-900"
                              : isSelected
                                ? "border-red-300 bg-red-50 text-red-900"
                                : "border-slate-200 text-slate-600",
                          )}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-bold">
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="min-w-0 flex-1">{opt}</span>
                          {isCorrect ? (
                            <Badge tone="success" size="sm">
                              {t("result.correctAnswer")}
                            </Badge>
                          ) : isSelected ? (
                            <Badge tone="danger" size="sm">
                              {t("result.yourAnswer")}
                            </Badge>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  {r.explanation ? (
                    <div className="mt-3 flex gap-2.5 rounded-xl bg-brand-50/70 p-3">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
                          {t("result.explanation")}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{r.explanation}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </StudentShell>
  );
}
