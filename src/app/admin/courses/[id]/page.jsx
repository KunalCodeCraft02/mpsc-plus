"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Library,
  ListTree,
  Video,
  FileText,
  ClipboardList,
  Users,
  BarChart3,
  ExternalLink,
  Tag,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  Card,
  Badge,
  StatTile,
  SectionHeader,
  PageLoader,
  StatusBadge,
  ProgressBar,
  Alert,
} from "@/components/ui";
import { formatPrice, formatDate } from "@/lib/utils";

const MANAGE = [
  { key: "subjects", icon: Library, href: (id) => `/admin/subjects?courseId=${id}` },
  { key: "chapters", icon: ListTree, href: (id) => `/admin/chapters?courseId=${id}` },
  { key: "lectures", icon: Video, href: (id) => `/admin/lectures?courseId=${id}` },
  { key: "pdfs", icon: FileText, href: (id) => `/admin/pdfs?courseId=${id}` },
  { key: "quizzes", icon: ClipboardList, href: (id) => `/admin/quizzes?courseId=${id}` },
  { key: "students", icon: Users, href: () => `/admin/students` },
];

export default function AdminCourseDetail() {
  const { id } = useParams();
  const { t, tf } = useI18n();
  const toast = useToast();
  const [course, setCourse] = useState(null);
  const [counts, setCounts] = useState(null);

  const load = () => {
    adminService
      .get("courses", id)
      .then(({ item }) => setCourse(item))
      .catch((e) => toast.error(e.message));
    adminService
      .list("courses", { perPage: 100 })
      .then((d) => {
        const row = (d.items || []).find((c) => String(c.id) === String(id));
        setCounts(row || null);
      })
      .catch(() => {});
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [id]);

  const act = async (action) => {
    try {
      await adminService.update("courses", id, { __action: action });
      toast.success(t("admin.saved"));
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!course) return <PageLoader />;

  return (
    <AdminShell
      title={tf(course, "title")}
      subtitle={`${course.instructor || "—"} · ${course.category || "—"} · ${course.language}`}
      breadcrumbs={[
        { label: t("admin.dashboard"), href: "/admin" },
        { label: t("admin.courses"), href: "/admin/courses" },
        { label: tf(course, "title") },
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button as={Link} href={`/courses/${course.id}`} target="_blank" variant="outline" size="md" leftIcon={ExternalLink}>
            {t("common.preview")}
          </Button>
          <Button variant="outline" size="md" leftIcon={Tag} onClick={() => act(course.isFree ? "makePaid" : "makeFree")}>
            {course.isFree ? t("common.paid") : t("common.free")}
          </Button>
          <Button variant="outline" size="md" leftIcon={Copy} onClick={() => act("duplicate")}>
            {t("common.duplicate")}
          </Button>
          <Button size="md" leftIcon={course.published ? EyeOff : Eye} onClick={() => act(course.published ? "unpublish" : "publish")}>
            {course.published ? t("common.unpublish") : t("common.publish")}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatTile icon={Library} label={t("common.subjects")} value={counts?.subjectCount ?? "—"} />
          <StatTile icon={Video} label={t("common.lectures")} value={counts?.lectureCount ?? "—"} tone="accent" />
          <StatTile icon={FileText} label={t("common.pdfs")} value={counts?.pdfCount ?? "—"} tone="amber" />
          <StatTile icon={ClipboardList} label={t("common.quizzes")} value={counts?.quizCount ?? "—"} tone="teal" />
          <StatTile icon={Users} label={t("common.students")} value={counts?.studentCount ?? "—"} tone="brand" />
          <StatTile
            icon={Tag}
            label={t("admin.pricing")}
            value={course.isFree ? t("common.free") : formatPrice(course.price, course.currency)}
            tone="slate"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <SectionHeader title={t("admin.overview")} subtitle={`${t("common.createdAt")} ${formatDate(course.createdAt)}`} />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge published={course.published} labels={{ published: t("common.published"), draft: t("common.draft") }} />
              <Badge tone={course.isFree ? "teal" : "amber"}>{course.isFree ? t("common.free") : formatPrice(course.price, course.currency)}</Badge>
              <Badge tone="outline">{course.language}</Badge>
              <Badge tone="outline">
                {course.validityDays ? `${course.validityDays} ${t("course.days")}` : t("course.lifetime")}
              </Badge>
            </div>
            <p className="mt-3.5 text-[13.5px] leading-relaxed text-muted">
              {tf(course, "description") || "No description yet."}
            </p>
            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 font-mono text-[11.5px] text-muted">
              <p>MPSC Pulse › {tf(course, "title")}</p>
              <p>├── {t("common.subjects")} ({counts?.subjectCount ?? 0})</p>
              <p>├── {t("common.lectures")} ({counts?.lectureCount ?? 0})</p>
              <p>├── {t("common.pdfs")} ({counts?.pdfCount ?? 0})</p>
              <p>├── {t("common.quizzes")} ({counts?.quizCount ?? 0})</p>
              <p>└── {t("common.students")} ({counts?.studentCount ?? 0})</p>
            </div>
          </Card>

          <Card>
            <SectionHeader title={t("admin.manage")} icon={BarChart3} />
            <div className="grid gap-2">
              {MANAGE.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.key}
                    href={m.href(course.id)}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-[13.5px] font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <Icon className="h-4 w-4 text-brand-600" />
                    {t(`admin.${m.key}`)}
                    <span className="ml-auto text-[11px] text-muted">{t("admin.manage")}</span>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>

        <Card>
          <SectionHeader title={t("course.includes")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("common.lectures")}</p>
              <ProgressBar value={Math.min(100, (counts?.lectureCount || 0) * 4)} className="mt-2" showLabel />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("common.pdfs")}</p>
              <ProgressBar value={Math.min(100, (counts?.pdfCount || 0) * 8)} tone="amber" className="mt-2" showLabel />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("common.quizzes")}</p>
              <ProgressBar value={Math.min(100, (counts?.quizCount || 0) * 20)} tone="teal" className="mt-2" showLabel />
            </div>
          </div>
        </Card>

        <Alert tone="info" title="Pricing can change at any time">
          Switching between FREE and PAID takes effect immediately for new enrolments. Existing
          enrolments keep their access.
        </Alert>
      </div>
    </AdminShell>
  );
}
