"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookMarked, PlayCircle, ClipboardCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { learningService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import {
  Tabs,
  Card,
  Badge,
  Button,
  ProgressBar,
  SectionHeader,
  SkeletonList,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { ActivityRow } from "@/components/cards/ContentCards";
import { formatDate } from "@/lib/utils";

function CourseProgressCard({ course, t, tf }) {
  return (
    <Link
      href={`/courses/${course.courseId}`}
      className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-soft transition hover:border-brand-200 hover:shadow-card"
    >
      <div className="relative w-24 shrink-0 overflow-hidden rounded-xl sm:w-32">
        <div className="aspect-video bg-brand-800">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <BookMarked className="absolute inset-0 m-auto h-6 w-6 text-white/70" />
          )}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13.5px] font-bold leading-snug text-ink group-hover:text-brand-700">
            {tf(course, "title")}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] text-muted">
            {course.instructor} · {course.completedCount}/{course.lectureCount} {t("common.lectures")}
          </p>
        </div>
        <div className="mt-2">
          <ProgressBar value={course.progressPercent} size="sm" showLabel tone={course.progressPercent >= 100 ? "teal" : "brand"} />
          <p className="mt-1.5 text-[11px] text-muted">
            {t("profile.memberSince")} {formatDate(course.enrolledAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function MyLearningPage() {
  const { t, tf } = useI18n();
  const [tab, setTab] = useState("inProgress");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    learningService.myLearning().then(setData).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const list = data ? (tab === "inProgress" ? data.inProgress : data.completed) : [];

  return (
    <StudentShell title={t("learning.title")}>
      <Tabs
        className="mb-4"
        fill
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "inProgress", label: t("learning.inProgress"), count: data?.inProgress.length },
          { value: "completed", label: t("learning.completed"), count: data?.completed.length },
        ]}
      />

      {error ? (
        <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
      ) : !data ? (
        <SkeletonList rows={4} />
      ) : list.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((c) => (
            <CourseProgressCard key={c.courseId} course={c} t={t} tf={tf} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookMarked}
          title={t("learning.empty")}
          description={t("learning.emptySub")}
          action={
            <Button as={Link} href="/courses" rightIcon={ArrowRight}>
              {t("home.exploreCourses")}
            </Button>
          }
        />
      )}

      {data?.activity?.length ? (
        <Card className="mt-6">
          <SectionHeader title={t("learning.activity")} />
          <div className="divide-y divide-slate-50">
            {data.activity.map((a, i) => (
              <ActivityRow
                key={`${a.kind}-${a.refId}-${i}`}
                icon={a.kind === "quiz" ? ClipboardCheck : PlayCircle}
                tone={a.kind === "quiz" ? "teal" : "brand"}
                title={tf(a, "title")}
                meta={a.courseTitle || formatDate(a.at)}
                right={
                  a.kind === "quiz" ? (
                    <Badge tone={a.passed ? "success" : "danger"}>{a.percent}%</Badge>
                  ) : a.completed ? (
                    <Badge tone="success" icon={CheckCircle2}>
                      {t("lecture.completed")}
                    </Badge>
                  ) : null
                }
              />
            ))}
          </div>
        </Card>
      ) : null}
    </StudentShell>
  );
}
