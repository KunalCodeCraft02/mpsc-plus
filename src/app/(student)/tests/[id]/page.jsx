"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Grid3x3,
  CheckCircle2,
  Play,
  AlertTriangle,
} from "lucide-react";
import { catalogService, learningService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  Badge,
  Card,
  ProgressBar,
  Modal,
  BottomSheet,
  PageLoader,
  ErrorState,
  Alert,
} from "@/components/ui";
import { BrandLock } from "@/components/layout/Brand";
import { cn, formatSeconds } from "@/lib/utils";

export default function QuizAttemptPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, tf } = useI18n();
  const toast = useToast();

  const [paper, setPaper] = useState(null);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [left, setLeft] = useState(0);
  const [palette, setPalette] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    catalogService
      .quiz(id)
      .then((d) => {
        setPaper(d);
        setLeft((d.quiz.timeLimitMin || 15) * 60);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const payload = {
          answers: Object.fromEntries(
            (paper?.questions || []).map((q) => [String(q.id), answers[q.id] ?? -1]),
          ),
          timeTakenSec: startedAt.current
            ? Math.round((Date.now() - startedAt.current) / 1000)
            : 0,
        };
        const res = await learningService.submitQuiz(id, payload);
        if (auto) toast.info("Time is up — your test was submitted automatically.");
        router.replace(`/results/${res.attemptId}`);
      } catch (e) {
        submittedRef.current = false;
        toast.error(e.message);
        setSubmitting(false);
      }
    },
    [answers, id, paper, router, toast],
  );

  // Timer
  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          submit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, submit]);

  // Warn before leaving
  useEffect(() => {
    if (!started) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = t("quiz.leaveWarning");
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [started, t]);

  const questions = paper?.questions || [];
  const current = questions[index];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] p-5">
        <ErrorState title={t("common.somethingWrong")} description={error} onRetry={() => router.push("/tests")} retryLabel={t("result.backToTests")} />
      </div>
    );
  }
  if (!paper) return <PageLoader />;

  /* ------------------------------ Start screen ----------------------------- */
  if (!started) {
    return (
      <div className="min-h-dvh bg-[#f6f7fb] px-4 py-6 safe-top">
        <div className="mx-auto max-w-lg">
          <BrandLock size={34} showTagline={false} />
          <Card className="mt-5">
            <Badge tone={paper.quiz.difficulty === "hard" ? "danger" : paper.quiz.difficulty === "easy" ? "teal" : "amber"}>
              {t(`tests.${paper.quiz.difficulty}`)}
            </Badge>
            <h1 className="mt-2.5 text-xl font-bold leading-tight tracking-tight text-ink">
              {tf(paper.quiz, "title")}
            </h1>
            <p className="mt-1 text-[12.5px] text-muted">
              {tf({ title: paper.quiz.courseTitle, titleMr: paper.quiz.courseTitleMr }, "title")}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {[
                [t("tests.questions"), paper.quiz.questionCount],
                [t("tests.marks"), paper.quiz.totalMarks],
                [t("tests.timeLimit"), `${paper.quiz.timeLimitMin} ${t("common.minutes")}`],
                [t("tests.passing"), `${paper.quiz.passingPercent}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted">{label}</p>
                  <p className="mt-0.5 text-[15px] font-bold text-ink">{value}</p>
                </div>
              ))}
            </div>

            {paper.lastAttempt ? (
              <Alert tone="info" className="mt-4">
                Last attempt: {paper.lastAttempt.score}/{paper.lastAttempt.totalMarks} ({paper.lastAttempt.percent}%)
              </Alert>
            ) : null}

            <Alert tone="warning" className="mt-4" title="Before you begin">
              The timer starts immediately and cannot be paused. Results are calculated on our
              servers, so keep the tab open until submission completes.
            </Alert>

            <div className="mt-5 flex gap-2.5">
              <Button variant="outline" size="lg" onClick={() => router.push("/tests")}>
                {t("common.back")}
              </Button>
              <Button
                size="lg"
                fullWidth
                leftIcon={Play}
                onClick={() => {
                  startedAt.current = Date.now();
                  setStarted(true);
                }}
                disabled={!questions.length}
              >
                {paper.lastAttempt ? t("tests.retake") : t("tests.startQuiz")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /* ------------------------------ Attempt view ----------------------------- */
  const paletteContent = (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {questions.map((q, i) => {
        const isAnswered = answers[q.id] != null;
        const isMarked = marked[q.id];
        return (
          <button
            key={q.id}
            onClick={() => {
              setIndex(i);
              setPalette(false);
            }}
            className={cn(
              "flex h-10 items-center justify-center rounded-lg text-[13px] font-bold transition",
              i === index
                ? "bg-brand-600 text-white ring-2 ring-brand-300"
                : isMarked
                  ? "bg-amber-100 text-amber-700"
                  : isAnswered
                    ? "bg-teal-100 text-teal-700"
                    : "bg-slate-100 text-slate-500",
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f7fb]">
      {/* Sticky exam header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-lg safe-top">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-ink">{tf(paper.quiz, "title")}</p>
            <p className="text-[11px] text-muted">
              {answeredCount}/{questions.length} {t("quiz.answered")}
            </p>
          </div>
          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[14px] font-bold tabular-nums",
              left < 60 ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-700",
            )}
          >
            <Clock className="h-4 w-4" />
            {formatSeconds(left)}
          </div>
          <Button variant="outline" size="icon" onClick={() => setPalette(true)} className="shrink-0 lg:hidden" title={t("quiz.palette")}>
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
        <ProgressBar value={((index + 1) / questions.length) * 100} size="sm" className="px-0" barClassName="rounded-none" />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 gap-5 px-3 py-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  {t("quiz.question")} {index + 1} / {questions.length}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge tone="outline">+{current.marks}</Badge>
                  {Number(current.negativeMarks) > 0 ? (
                    <Badge tone="danger">-{current.negativeMarks}</Badge>
                  ) : null}
                </div>
              </div>
              <button
                onClick={() => setMarked((m) => ({ ...m, [current.id]: !m[current.id] }))}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition",
                  marked[current.id]
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                )}
              >
                <Flag className="h-3.5 w-3.5" />
                {marked[current.id] ? t("quiz.marked") : t("quiz.markReview")}
              </button>
            </div>

            <p className="mt-4 text-[15.5px] font-semibold leading-relaxed text-ink">
              {tf({ text: current.text, textMr: current.textMr }, "text")}
            </p>

            <div className="mt-4 space-y-2.5">
              {(tf({ options: current.options, optionsMr: current.optionsMr }, "options") || []).map((opt, oi) => {
                const selected = answers[current.id] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers((a) => ({ ...a, [current.id]: oi }))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition",
                      selected
                        ? "border-brand-600 bg-brand-50"
                        : "border-slate-200 bg-white hover:border-brand-300",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12.5px] font-bold",
                        selected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {selected ? <CheckCircle2 className="h-4 w-4" /> : String.fromCharCode(65 + oi)}
                    </span>
                    <span className="text-[14.5px] leading-snug text-ink">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              <Button
                variant="outline"
                size="lg"
                leftIcon={ChevronLeft}
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                {t("common.previous")}
              </Button>
              {index < questions.length - 1 ? (
                <Button size="lg" fullWidth rightIcon={ChevronRight} onClick={() => setIndex((i) => i + 1)}>
                  {t("common.next")}
                </Button>
              ) : (
                <Button size="lg" fullWidth variant="success" leftIcon={Send} onClick={() => setConfirm(true)}>
                  {t("quiz.submitQuiz")}
                </Button>
              )}
            </div>
          </Card>

          <Button variant="ghost" size="sm" className="mt-3 text-accent-600" leftIcon={Send} onClick={() => setConfirm(true)}>
            {t("quiz.submitQuiz")}
          </Button>
        </div>

        {/* Desktop palette */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <Card className="sticky top-24">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-muted">
              {t("quiz.palette")}
            </p>
            {paletteContent}
            <div className="mt-4 space-y-1.5 text-[11.5px]">
              <p className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-teal-100" /> {t("quiz.answered")} ({answeredCount})
              </p>
              <p className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-amber-100" /> {t("quiz.marked")} ({Object.values(marked).filter(Boolean).length})
              </p>
              <p className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-slate-100" /> {t("quiz.unanswered")} ({questions.length - answeredCount})
              </p>
            </div>
            <Button variant="success" size="sm" fullWidth className="mt-4" leftIcon={Send} onClick={() => setConfirm(true)}>
              {t("quiz.submitQuiz")}
            </Button>
          </Card>
        </aside>
      </main>

      <BottomSheet open={palette} onClose={() => setPalette(false)} title={t("quiz.palette")}>
        {paletteContent}
      </BottomSheet>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t("quiz.confirmSubmitTitle")}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" variant="success" loading={submitting} onClick={() => submit(false)}>
              {submitting ? t("quiz.submitting") : t("common.submit")}
            </Button>
          </>
        }
      >
        <div className="flex gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[13.5px] leading-relaxed text-muted">{t("quiz.confirmSubmitBody")}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-teal-50 p-2">
                <p className="text-[16px] font-bold text-teal-700">{answeredCount}</p>
                <p className="text-[10px] font-bold uppercase text-teal-600">{t("quiz.answered")}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2">
                <p className="text-[16px] font-bold text-amber-700">
                  {Object.values(marked).filter(Boolean).length}
                </p>
                <p className="text-[10px] font-bold uppercase text-amber-600">{t("quiz.marked")}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <p className="text-[16px] font-bold text-slate-700">{questions.length - answeredCount}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500">{t("quiz.unanswered")}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
