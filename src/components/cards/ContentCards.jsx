"use client";

import Link from "next/link";
import {
  PlayCircle,
  FileText,
  ClipboardList,
  Clock,
  Lock,
  Users,
  Layers,
  Download,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { cn, formatDuration, formatPrice, formatFileSize } from "@/lib/utils";
import { Badge, ProgressBar, Card } from "@/components/ui";
import { useI18n } from "@/context/I18nContext";

function Thumb({ src, fallbackIcon: Icon = PlayCircle, className, ratio = "aspect-video" }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-brand-800",
        ratio,
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon className="h-8 w-8 text-white/70" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ CourseCard ---------------------------- */
export function CourseCard({ course, progress, variant = "grid" }) {
  const { t, tf } = useI18n();
  const href = `/courses/${course.id}`;

  if (variant === "row") {
    return (
      <Link
        href={href}
        className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-soft transition hover:border-brand-200 hover:shadow-card"
      >
        <Thumb src={course.thumbnailUrl} className="w-28 shrink-0 sm:w-36" />
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div className="min-w-0">
            <p className="line-clamp-2 text-[13.5px] font-bold leading-snug text-ink group-hover:text-brand-700">
              {tf(course, "title")}
            </p>
            <p className="mt-1 truncate text-[11.5px] text-muted">{course.instructor}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={course.isFree ? "teal" : "amber"} size="sm">
              {course.isFree ? t("common.free") : formatPrice(course.price, course.currency)}
            </Badge>
            <Badge tone="outline" size="sm">
              {course.lectureCount || 0} {t("course.lectureCount")}
            </Badge>
          </div>
          {progress != null ? (
            <ProgressBar value={progress} size="sm" className="mt-2" showLabel />
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition hover:border-brand-200 hover:shadow-card"
    >
      <div className="relative p-2.5 pb-0">
        <Thumb src={course.thumbnailUrl} />
        <div className="absolute left-4 top-4 flex gap-1.5">
          <Badge tone={course.isFree ? "teal" : "dark"} size="sm">
            {course.isFree ? t("common.free") : t("common.paid")}
          </Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-[13.5px] font-bold leading-snug text-ink group-hover:text-brand-700">
          {tf(course, "title")}
        </p>
        <p className="mt-1 truncate text-[11.5px] text-muted">{course.instructor}</p>
        <div className="mt-2.5 flex items-center gap-3 text-[11px] font-medium text-muted">
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" />
            {course.lectureCount || 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {course.pdfCount || 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" />
            {course.quizCount || 0}
          </span>
        </div>
        {progress != null ? (
          <ProgressBar value={progress} size="sm" className="mt-3" showLabel />
        ) : (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span className="text-[13px] font-bold text-ink">
              {course.isFree ? t("common.free") : formatPrice(course.price, course.currency)}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
              <Users className="h-3.5 w-3.5" />
              {course.studentCount || 0}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ----------------------------- LectureCard ---------------------------- */
export function LectureCard({ lecture, locked, completed, progress, href }) {
  const { t, tf } = useI18n();
  const Wrapper = locked ? "div" : Link;
  const wrapperProps = locked ? {} : { href: href || `/lectures/${lecture.id}` };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-soft transition",
        locked ? "opacity-70" : "hover:border-brand-200 hover:shadow-card",
      )}
    >
      <div className="relative w-24 shrink-0 sm:w-28">
        <Thumb
          src={
            lecture.thumbnailUrl ||
            (lecture.youtubeId ? `https://i.ytimg.com/vi/${lecture.youtubeId}/mqdefault.jpg` : null)
          }
        />
        <span className="absolute inset-0 flex items-center justify-center">
          {locked ? (
            <Lock className="h-5 w-5 text-white drop-shadow" />
          ) : (
            <PlayCircle className="h-6 w-6 text-white/90 drop-shadow transition group-hover:scale-110" />
          )}
        </span>
        {lecture.durationMin ? (
          <span className="absolute bottom-1 right-1 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {formatDuration(lecture.durationMin)}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-ink group-hover:text-brand-700">
          {tf(lecture, "title")}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {lecture.isFree ? (
            <Badge tone="teal" size="sm">
              {t("course.freePreview")}
            </Badge>
          ) : null}
          {completed ? (
            <Badge tone="success" size="sm" icon={CheckCircle2}>
              {t("lecture.completed")}
            </Badge>
          ) : null}
          {lecture.chapterTitle ? (
            <span className="truncate text-[11px] text-muted">{lecture.chapterTitle}</span>
          ) : null}
        </div>
        {progress > 0 && !completed ? (
          <ProgressBar value={progress} size="sm" className="mt-2" tone="accent" />
        ) : null}
      </div>
    </Wrapper>
  );
}

/* ------------------------------- PDFCard ------------------------------ */
export function PDFCard({ pdf, locked, href }) {
  const { t, tf } = useI18n();
  const Wrapper = locked ? "div" : Link;
  const wrapperProps = locked ? {} : { href: href || `/materials/${pdf.id}` };
  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-soft transition",
        locked ? "opacity-70" : "hover:border-brand-200 hover:shadow-card",
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
        {locked ? <Lock className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-ink group-hover:text-brand-700">
          {tf(pdf, "title")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
          {pdf.pageCount ? <span>{pdf.pageCount} {t("pdf.pages")}</span> : null}
          {pdf.fileSizeKb ? <span>{formatFileSize(pdf.fileSizeKb)}</span> : null}
          {pdf.isFree ? (
            <Badge tone="teal" size="sm">
              {t("common.free")}
            </Badge>
          ) : null}
        </div>
      </div>
      {pdf.allowDownload && !locked ? (
        <Download className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
      ) : null}
    </Wrapper>
  );
}

/* ------------------------------- QuizCard ----------------------------- */
export function QuizCard({ quiz, attempt, locked, href }) {
  const { t, tf } = useI18n();
  const diffTone =
    quiz.difficulty === "easy" ? "teal" : quiz.difficulty === "hard" ? "danger" : "amber";
  const Wrapper = locked ? "div" : Link;
  const wrapperProps = locked ? {} : { href: href || `/tests/${quiz.id}` };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group block rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-soft transition",
        locked ? "opacity-70" : "hover:border-brand-200 hover:shadow-card",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {locked ? <Lock className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13.5px] font-bold leading-snug text-ink group-hover:text-brand-700">
            {tf(quiz, "title")}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={diffTone} size="sm">
              {t(`tests.${quiz.difficulty || "medium"}`)}
            </Badge>
            <Badge tone="outline" size="sm" icon={Layers}>
              {quiz.questionCount || 0} {t("tests.questions")}
            </Badge>
            <Badge tone="outline" size="sm" icon={Clock}>
              {quiz.timeLimitMin} {t("common.minutes")}
            </Badge>
          </div>
        </div>
      </div>
      {attempt ? (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-muted">
            <BarChart3 className="h-3.5 w-3.5" />
            {t("result.score")}: {attempt.score}/{attempt.totalMarks}
          </span>
          <Badge tone={attempt.passed ? "success" : "danger"} size="sm">
            {attempt.percent}%
          </Badge>
        </div>
      ) : null}
    </Wrapper>
  );
}

export function ActivityRow({ icon: Icon = PlayCircle, title, meta, right, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    teal: "bg-teal-50 text-teal-600",
    accent: "bg-accent-50 text-accent-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{title}</p>
        {meta ? <p className="truncate text-[11px] text-muted">{meta}</p> : null}
      </div>
      {right}
    </div>
  );
}

export { Card };
