"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ChevronDown,
  PlayCircle,
  FileText,
  Layers,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { catalogService, learningService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Card,
  Badge,
  Button,
  ProgressBar,
  SectionHeader,
  PageLoader,
  ErrorState,
} from "@/components/ui";
import { PDFCard } from "@/components/cards/ContentCards";
import { cn, formatDuration } from "@/lib/utils";

export default function LecturePlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, tf } = useI18n();
  const { refresh } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    catalogService
      .lecture(id)
      .then((d) => {
        setData(d);
        if (d.lecture.chapterId) setOpen({ [d.lecture.chapterId]: true });
      })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  // Record that the lecture was opened (position tracking without a heavy player API).
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      learningService
        .saveProgress({ lectureId: Number(id), positionSec: 30, percent: 15, completed: false })
        .catch(() => {});
    }, 4000);
    return () => clearTimeout(timer);
  }, [data, id]);

  const markComplete = async () => {
    setBusy(true);
    try {
      const res = await learningService.saveProgress({
        lectureId: Number(id),
        positionSec: (data.lecture.durationMin || 0) * 60,
        percent: 100,
        completed: true,
      });
      if (res.xpEarned > 0) toast.success(`+${res.xpEarned} XP`, { title: t("lecture.completed") });
      else toast.info(t("lecture.completed"));
      (res.badges || []).forEach((b) => toast.success(t(`gamify.badges.${b}`), { title: "Badge unlocked" }));
      await refresh();
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <StudentShell title={t("lecture.player")}>
        <ErrorState
          title={t("common.somethingWrong")}
          description={error}
          onRetry={() => router.push("/my-learning")}
          retryLabel={t("learning.title")}
        />
      </StudentShell>
    );
  }
  if (!data) {
    return (
      <StudentShell title={t("lecture.player")}>
        <PageLoader />
      </StudentShell>
    );
  }

  const { lecture, course, chapter, subject, prev, next, progress, courseProgressPercent } = data;
  const completed = !!progress?.completed;

  return (
    <StudentShell title={t("lecture.player")}>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {/* Player */}
          <div className="overflow-hidden rounded-2xl bg-ink shadow-card">
            <div className="relative aspect-video">
              {lecture.youtubeId ? (
                <iframe
                  key={lecture.youtubeId}
                  src={`https://www.youtube-nocookie.com/embed/${lecture.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
                  title={tf(lecture, "title")}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[13px] text-white/60">
                  Video unavailable
                </div>
              )}
            </div>
          </div>

          {/* Meta */}
          <Card className="mt-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {lecture.isFree ? <Badge tone="teal">{t("course.freePreview")}</Badge> : null}
              <Badge tone="outline">{formatDuration(lecture.durationMin)}</Badge>
              {completed ? (
                <Badge tone="success" icon={CheckCircle2}>
                  {t("lecture.completed")}
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-2.5 text-lg font-bold leading-snug tracking-tight text-ink sm:text-xl">
              {tf(lecture, "title")}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
              {course ? (
                <Link href={`/courses/${course.id}`} className="font-semibold text-brand-600 hover:underline">
                  {tf(course, "title")}
                </Link>
              ) : null}
              {subject ? <span>· {tf(subject, "name")}</span> : null}
              {chapter ? <span>· {tf(chapter, "title")}</span> : null}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[12px] font-semibold">
                <span className="text-muted">{t("learning.progress")}</span>
                <span className="text-brand-700">{courseProgressPercent}%</span>
              </div>
              <ProgressBar value={courseProgressPercent} size="sm" className="mt-1.5" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button
                variant={completed ? "outline" : "success"}
                leftIcon={completed ? CheckCircle2 : Zap}
                loading={busy}
                onClick={markComplete}
                disabled={completed}
              >
                {completed ? t("lecture.completed") : t("lecture.markComplete")}
              </Button>
              <Button
                variant="outline"
                leftIcon={ChevronLeft}
                disabled={!prev}
                onClick={() => prev && router.push(`/lectures/${prev.id}`)}
              >
                {t("lecture.prevLecture")}
              </Button>
              <Button
                rightIcon={ChevronRight}
                disabled={!next}
                onClick={() => next && router.push(`/lectures/${next.id}`)}
              >
                {t("lecture.nextLecture")}
              </Button>
            </div>

            {lecture.description ? (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-[12px] font-bold uppercase tracking-wide text-muted">
                  {t("lecture.aboutLecture")}
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-slate-700">
                  {lecture.description}
                </p>
              </div>
            ) : null}
          </Card>

          {data.pdfs?.length ? (
            <div className="mt-4">
              <SectionHeader title={t("lecture.notes")} icon={FileText} />
              <div className="space-y-2.5">
                {data.pdfs.map((p) => (
                  <PDFCard key={p.id} pdf={p} />
                ))}
              </div>
            </div>
          ) : null}

          <Button as={Link} href="/my-learning" variant="ghost" size="sm" className="mt-4" leftIcon={ArrowLeft}>
            {t("learning.title")}
          </Button>
        </div>

        {/* Chapter list */}
        <aside className="min-w-0">
          <Card padded={false} className="overflow-hidden lg:sticky lg:top-24">
            <div className="border-b border-slate-100 p-3.5">
              <p className="flex items-center gap-2 text-[13px] font-bold text-ink">
                <Layers className="h-4 w-4 text-brand-600" />
                {t("lecture.chapterList")}
              </p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {data.chapters.map((c) => (
                <div key={c.id} className="border-b border-slate-50 last:border-0">
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}
                    className="flex w-full items-center gap-2.5 p-3 text-left transition hover:bg-slate-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-ink">{tf(c, "title")}</span>
                      <span className="block text-[11px] text-muted">
                        {c.lectures.filter((l) => l.completed).length}/{c.lectures.length} {t("common.lectures")}
                      </span>
                    </span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition", open[c.id] && "rotate-180")} />
                  </button>
                  {open[c.id] ? (
                    <div className="bg-slate-50/50 pb-2">
                      {c.lectures.map((l) => {
                        const active = String(l.id) === String(id);
                        return (
                          <Link
                            key={l.id}
                            href={`/lectures/${l.id}`}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 text-[12.5px] transition",
                              active ? "bg-brand-50 font-bold text-brand-700" : "text-slate-600 hover:bg-white",
                            )}
                          >
                            {l.completed ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-500" />
                            ) : (
                              <PlayCircle className="h-4 w-4 shrink-0 text-slate-400" />
                            )}
                            <span className="min-w-0 flex-1 truncate">{tf(l, "title")}</span>
                            <span className="shrink-0 text-[10.5px] text-muted">{formatDuration(l.durationMin)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </StudentShell>
  );
}
