"use client";

import Link from "next/link";
import { PlayCircle, FileText, Users, ArrowRight } from "lucide-react";
import { Badge, StatusBadge, PriceBadge } from "@/components/ui";
import { formatDate, formatDuration, formatFileSize, formatPrice, extractYoutubeId } from "@/lib/utils";
import { CATEGORIES } from "@/lib/config";
import { LectureBuilderSection, PdfBuilderSection } from "./CourseContentBuilder";
import { adminService } from "@/services/api";

const langOptions = [
  { value: "Marathi", label: "Marathi" },
  { value: "English", label: "English" },
  { value: "Bilingual", label: "Bilingual" },
];

const publishFilter = (t) => ({
  name: "status",
  label: t("common.status"),
  options: [
    { value: "published", label: t("common.published") },
    { value: "draft", label: t("common.draft") },
  ],
});

const accessFilter = (t) => ({
  name: "access",
  label: t("admin.pricing"),
  options: [
    { value: "free", label: t("common.free") },
    { value: "paid", label: t("common.paid") },
  ],
});

const courseFilter = (t) => ({
  name: "courseId",
  label: t("admin.courses"),
  source: "courses",
});

function TitleCell(row, tf, sub) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-ink">{tf(row, "title") || row.name}</p>
      {sub ? <p className="truncate text-[11.5px] text-muted">{sub}</p> : null}
    </div>
  );
}

/* -------------------------------- Courses ----------------------------- */
export const coursesConfig = (t, tf) => ({
  createLabel: t("admin.newCourse"),
  searchPlaceholder: `${t("common.search")} ${t("admin.courses").toLowerCase()}…`,
  formDescription: "Fill in each section below. The student preview on the right updates as you type.",
  supportsPublish: true,
  supportsPricing: true,
  supportsDuplicate: true,
  defaultSort: "createdAt",
  perPage: 10,
  filters: [publishFilter(t), accessFilter(t), { name: "language", label: t("common.language"), options: langOptions }],
  defaults: {
    title: "", titleMr: "", description: "", descriptionMr: "", thumbnailUrl: "",
    instructor: "", category: CATEGORIES[0], language: "Marathi",
    isFree: true, price: 0, currency: "INR", validityDays: 365, published: false,
    lectures: [], pdfs: [],
  },
  // The course entity itself has no lectures/pdfs fields — strip the builder
  // arrays before they hit the course create/update payload; they're saved
  // separately via afterSave once the course id is known.
  fromForm: (v) => {
    const { lectures: _lectures, pdfs: _pdfs, ...courseFields } = v;
    return courseFields;
  },
  // Course content (lectures/pdfs) isn't part of the course record returned
  // by GET /admin/courses/:id — fetch it separately when opening Edit.
  afterLoad: async (values, item) => {
    const content = await adminService.getCourseContent(item.id);
    return { ...values, lectures: content.lectures, pdfs: content.pdfs };
  },
  afterSave: async (courseId, values) => {
    await adminService.saveCourseContent(courseId, {
      lectures: values.lectures || [],
      pdfs: values.pdfs || [],
    });
  },
  validate: (v) => {
    for (let i = 0; i < (v.lectures || []).length; i++) {
      const l = v.lectures[i];
      if (!l.title?.trim()) return `Lecture ${i + 1}: title is required.`;
      if (!extractYoutubeId(l.youtubeUrl || "")) return `Lecture ${i + 1}: enter a valid YouTube video URL.`;
    }
    for (let i = 0; i < (v.pdfs || []).length; i++) {
      const p = v.pdfs[i];
      if (!p.title?.trim()) return `PDF ${i + 1}: title is required.`;
      if (!p.url?.trim()) return `PDF ${i + 1}: a link is required.`;
    }
    return null;
  },
  columns: () => [
    {
      key: "title",
      label: t("common.title"),
      sortKey: "title",
      render: (r) => (
        <Link href={`/admin/courses/${r.id}`} className="group flex items-center gap-2">
          {TitleCell(r, tf, `${r.instructor || "—"} · ${r.category || "—"}`)}
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-brand-600" />
        </Link>
      ),
    },
    {
      key: "content",
      label: "Content",
      render: (r) => (
        <div className="flex items-center gap-2.5 text-[11.5px] font-semibold text-muted">
          <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" />{r.lectureCount}</span>
          <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{r.pdfCount}</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{r.studentCount}</span>
        </div>
      ),
    },
    {
      key: "price",
      label: t("common.price"),
      sortKey: "price",
      render: (r) => <PriceBadge isFree={r.isFree} price={r.price} currency={r.currency} labels={{ free: t("common.free") }} />,
    },
    { key: "language", label: t("common.language"), render: (r) => <Badge tone="outline">{r.language}</Badge> },
    {
      key: "published",
      label: t("common.status"),
      render: (r) => <StatusBadge published={r.published} labels={{ published: t("common.published"), draft: t("common.draft") }} />,
    },
    { key: "createdAt", label: t("common.createdAt"), sortKey: "createdAt", render: (r) => <span className="text-muted">{formatDate(r.createdAt)}</span> },
  ],
  renderCard: (r) => (
    <div className="space-y-2.5">
      <Link href={`/admin/courses/${r.id}`} className="block">
        <p className="font-bold leading-snug text-ink">{tf(r, "title")}</p>
        <p className="mt-0.5 text-[11.5px] text-muted">{r.instructor} · {r.category}</p>
      </Link>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge published={r.published} labels={{ published: t("common.published"), draft: t("common.draft") }} />
        <PriceBadge isFree={r.isFree} price={r.price} currency={r.currency} labels={{ free: t("common.free") }} />
        <Badge tone="outline">{r.lectureCount} {t("common.lectures")}</Badge>
        <Badge tone="outline">{r.studentCount} {t("common.students")}</Badge>
      </div>
    </div>
  ),
  sections: [
    {
      title: t("admin.basicInfo"),
      cols: 2,
      fields: [
        { name: "title", label: `${t("common.title")} (English)`, placeholder: "MPSC Rajyaseva Foundation 2026", full: true },
        { name: "titleMr", label: `${t("common.title")} (मराठी)`, placeholder: "MPSC राज्यसेवा पायाभूत २०२६", full: true },
        { name: "description", label: `${t("common.description")} (English)`, type: "textarea", full: true },
        { name: "descriptionMr", label: `${t("common.description")} (मराठी)`, type: "textarea", full: true },
        { name: "category", label: t("course.category"), type: "select", options: CATEGORIES.map((c) => ({ value: c, label: c })) },
        { name: "language", label: t("common.language"), type: "select", options: langOptions },
        { name: "instructor", label: t("course.instructor"), placeholder: "Prof. Sandeep Kulkarni" },
      ],
    },
    {
      title: t("admin.thumbnail"),
      hint: t("admin.thumbSectionHint"),
      fields: [
        { name: "thumbnailUrl", type: "thumbnail", full: true },
      ],
    },
    {
      title: t("admin.pricing"),
      cols: 2,
      fields: [
        { name: "isFree", label: `${t("common.free")} ${t("admin.access").toLowerCase()}`, type: "switch", hint: "Leave on to give this course away free. Turn it off to charge students.", full: true },
        { name: "price", label: `${t("common.price")} (₹)`, type: "number", showIf: (v) => !v.isFree },
        { name: "currency", label: "Currency", type: "select", options: [{ value: "INR", label: "INR ₹" }], showIf: (v) => !v.isFree },
        { name: "validityDays", label: `${t("course.validity")} (${t("course.days")})`, type: "number", hint: "How long a student keeps access after buying. Enter 0 for unlimited access.", showIf: (v) => !v.isFree },
      ],
    },
    {
      title: t("admin.publishing"),
      fields: [{ name: "published", label: t("common.published"), type: "switch", hint: "Draft courses stay hidden. Publish when the course is ready for students." }],
    },
    {
      title: "Lectures",
      hint: "Add each lecture with its title and YouTube link (upload the video as Unlisted on YouTube first, then paste the link here). Use the arrows to reorder.",
      render: ({ form }) => <LectureBuilderSection form={form} />,
    },
    {
      title: "Study Materials / PDFs",
      hint: "Link the PDFs and study material for this course.",
      render: ({ form }) => <PdfBuilderSection form={form} />,
    },
  ],
  renderPreview: (v) => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="aspect-video bg-brand-800">
        {v.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="p-3.5">
        <p className="text-[14px] font-bold leading-snug text-ink">{v.title || "Course title"}</p>
        <p className="mt-0.5 text-[11.5px] text-muted">{v.instructor || "Instructor"} · {v.category}</p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[15px] font-bold text-ink">
            {v.isFree ? t("common.free") : formatPrice(v.price, v.currency)}
          </span>
          <StatusBadge published={!!v.published} labels={{ published: t("common.published"), draft: t("common.draft") }} />
        </div>
      </div>
    </div>
  ),
});

/* -------------------------------- Subjects ---------------------------- */
export const subjectsConfig = (t, tf) => ({
  createLabel: t("admin.newSubject"),
  supportsPublish: false,
  defaultSort: "order",
  filters: [courseFilter(t)],
  defaults: { courseId: "", name: "", nameMr: "", description: "", orderIndex: 1 },
  columns: () => [
    { key: "name", label: t("common.title"), sortKey: "title", render: (r) => TitleCell(r, tf, r.courseTitle) },
    { key: "chapterCount", label: t("common.chapters"), render: (r) => <Badge tone="brand">{r.chapterCount}</Badge> },
    { key: "lectureCount", label: t("common.lectures"), render: (r) => <Badge tone="outline">{r.lectureCount}</Badge> },
    { key: "orderIndex", label: t("common.order"), sortKey: "order", render: (r) => <span className="font-bold tabular-nums">{r.orderIndex}</span> },
  ],
  sections: [
    {
      title: t("admin.basicInfo"),
      cols: 2,
      fields: [
        { name: "courseId", label: t("admin.courses"), type: "lookup", source: "courses", placeholder: "Select course", full: true },
        { name: "name", label: `${t("common.title")} (English)`, full: true },
        { name: "nameMr", label: `${t("common.title")} (मराठी)`, full: true },
        { name: "description", label: t("common.description"), type: "textarea", full: true },
        { name: "orderIndex", label: t("common.order"), type: "number" },
      ],
    },
  ],
});

/* -------------------------------- Chapters ---------------------------- */
export const chaptersConfig = (t, tf) => ({
  createLabel: t("admin.newChapter"),
  supportsPublish: false,
  defaultSort: "order",
  filters: [courseFilter(t), { name: "subjectId", label: t("admin.subjects"), source: "subjects" }],
  defaults: { courseId: "", subjectId: "", title: "", titleMr: "", description: "", orderIndex: 1 },
  columns: () => [
    { key: "title", label: t("common.title"), sortKey: "title", render: (r) => TitleCell(r, tf, `${r.courseTitle || "—"} › ${r.subjectName || "—"}`) },
    { key: "lectureCount", label: t("common.lectures"), render: (r) => <Badge tone="brand">{r.lectureCount}</Badge> },
    { key: "pdfCount", label: t("common.pdfs"), render: (r) => <Badge tone="outline">{r.pdfCount}</Badge> },
    { key: "orderIndex", label: t("common.order"), sortKey: "order", render: (r) => <span className="font-bold tabular-nums">{r.orderIndex}</span> },
  ],
  sections: [
    {
      title: t("admin.basicInfo"),
      cols: 2,
      fields: [
        { name: "courseId", label: t("admin.courses"), type: "lookup", source: "courses", full: true },
        { name: "subjectId", label: t("admin.subjects"), type: "lookup", source: "subjects", parent: "courseId", full: true },
        { name: "title", label: `${t("common.title")} (English)`, full: true },
        { name: "titleMr", label: `${t("common.title")} (मराठी)`, full: true },
        { name: "description", label: t("common.description"), type: "textarea", full: true },
        { name: "orderIndex", label: t("common.order"), type: "number" },
      ],
    },
  ],
});

/* -------------------------------- Lectures ---------------------------- */
export const lecturesConfig = (t, tf) => ({
  createLabel: t("admin.newLecture"),
  supportsPublish: true,
  supportsPricing: true,
  previewHref: (r) => `/lectures/${r.id}`,
  filters: [courseFilter(t), { name: "chapterId", label: t("admin.chapters"), source: "chapters" }, publishFilter(t), accessFilter(t)],
  defaults: {
    courseId: "", subjectId: "", chapterId: "", title: "", titleMr: "", description: "",
    youtubeUrl: "", durationMin: 30, orderIndex: 1, isFree: false, published: false,
  },
  toForm: (item) => ({ ...item, youtubeUrl: item.youtubeId || "" }),
  columns: () => [
    {
      key: "title",
      label: t("lecture.player"),
      sortKey: "title",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="relative h-9 w-14 shrink-0 overflow-hidden rounded-md bg-slate-200">
            {r.youtubeId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://i.ytimg.com/vi/${r.youtubeId}/default.jpg`} alt="" className="h-full w-full object-cover" />
            ) : null}
          </span>
          {TitleCell(r, tf, `${r.courseTitle || "—"} › ${r.chapterTitle || "—"}`)}
        </div>
      ),
    },
    { key: "durationMin", label: t("common.duration"), render: (r) => <span className="tabular-nums text-muted">{formatDuration(r.durationMin)}</span> },
    { key: "isFree", label: t("admin.pricing"), render: (r) => <Badge tone={r.isFree ? "teal" : "amber"}>{r.isFree ? t("common.free") : t("common.paid")}</Badge> },
    { key: "published", label: t("common.status"), render: (r) => <StatusBadge published={r.published} labels={{ published: t("common.published"), draft: t("common.draft") }} /> },
    { key: "createdAt", label: t("common.createdAt"), sortKey: "createdAt", render: (r) => <span className="text-muted">{formatDate(r.createdAt)}</span> },
  ],
  renderCard: (r) => (
    <div className="space-y-2.5">
      <div className="flex gap-3">
        <span className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200">
          {r.youtubeId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://i.ytimg.com/vi/${r.youtubeId}/default.jpg`} alt="" className="h-full w-full object-cover" />
          ) : null}
        </span>
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] font-bold leading-snug text-ink">{tf(r, "title")}</p>
          <p className="truncate text-[11px] text-muted">{r.courseTitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge published={r.published} labels={{ published: t("common.published"), draft: t("common.draft") }} />
        <Badge tone={r.isFree ? "teal" : "amber"}>{r.isFree ? t("common.free") : t("common.paid")}</Badge>
        <Badge tone="outline">{formatDuration(r.durationMin)}</Badge>
      </div>
    </div>
  ),
  sections: [
    {
      title: t("admin.basicInfo"),
      cols: 2,
      fields: [
        { name: "courseId", label: t("admin.courses"), type: "lookup", source: "courses", full: true },
        { name: "subjectId", label: t("admin.subjects"), type: "lookup", source: "subjects", parent: "courseId" },
        { name: "chapterId", label: t("admin.chapters"), type: "lookup", source: "chapters", parent: "courseId" },
        { name: "title", label: `${t("common.title")} (English)`, full: true },
        { name: "titleMr", label: `${t("common.title")} (मराठी)`, full: true },
        { name: "description", label: t("common.description"), type: "textarea", full: true },
      ],
    },
    {
      title: "YouTube",
      hint: t("admin.youtubeHelp"),
      cols: 2,
      fields: [
        { name: "youtubeUrl", label: t("admin.youtubeUrl"), placeholder: "https://youtube.com/watch?v=XXXXXXXXXXX", full: true },
        { name: "durationMin", label: `${t("common.duration")} (${t("common.minutes")})`, type: "number" },
        { name: "orderIndex", label: t("common.order"), type: "number" },
      ],
    },
    {
      title: `${t("admin.access")} & ${t("admin.publishing")}`,
      fields: [
        { name: "isFree", label: t("course.freePreview"), type: "switch", hint: "Free lectures are watchable without enrolment" },
        { name: "published", label: t("common.published"), type: "switch" },
      ],
    },
  ],
  renderPreview: (v) => {
    const id = extractYoutubeId(v.youtubeUrl || "");
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="aspect-video bg-ink">
          {id ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-white/60">
              Paste a YouTube link to preview
            </div>
          )}
        </div>
        <div className="p-3.5">
          <p className="text-[13.5px] font-bold text-ink">{v.title || "Lecture title"}</p>
          <p className="mt-1 text-[11.5px] text-muted">
            Video ID: <span className="font-mono">{id || "—"}</span> · {formatDuration(v.durationMin)}
          </p>
        </div>
      </div>
    );
  },
});

/* --------------------------------- PDFs ------------------------------- */
export const pdfsConfig = (t, tf) => ({
  createLabel: t("admin.newPdf"),
  supportsPublish: true,
  supportsPricing: true,
  previewHref: (r) => `/materials/${r.id}`,
  filters: [courseFilter(t), { name: "subjectId", label: t("admin.subjects"), source: "subjects" }, publishFilter(t), accessFilter(t)],
  defaults: {
    courseId: "", subjectId: "", chapterId: "", title: "", titleMr: "", description: "",
    fileUrl: "", fileSizeKb: 0, pageCount: 0, orderIndex: 1, isFree: false, allowDownload: true, published: false,
  },
  columns: () => [
    { key: "title", label: t("common.title"), sortKey: "title", render: (r) => TitleCell(r, tf, `${r.courseTitle || "—"} › ${r.chapterTitle || "—"}`) },
    { key: "pageCount", label: t("pdf.pages"), render: (r) => <span className="tabular-nums text-muted">{r.pageCount || "—"}</span> },
    { key: "fileSizeKb", label: t("pdf.size"), render: (r) => <span className="tabular-nums text-muted">{formatFileSize(r.fileSizeKb)}</span> },
    { key: "allowDownload", label: t("admin.allowDownload"), render: (r) => <Badge tone={r.allowDownload ? "success" : "neutral"}>{r.allowDownload ? t("common.yes") : t("common.no")}</Badge> },
    { key: "isFree", label: t("admin.pricing"), render: (r) => <Badge tone={r.isFree ? "teal" : "amber"}>{r.isFree ? t("common.free") : t("common.paid")}</Badge> },
    { key: "published", label: t("common.status"), render: (r) => <StatusBadge published={r.published} labels={{ published: t("common.published"), draft: t("common.draft") }} /> },
  ],
  sections: [
    {
      title: t("admin.basicInfo"),
      cols: 2,
      fields: [
        { name: "courseId", label: t("admin.courses"), type: "lookup", source: "courses", full: true },
        { name: "subjectId", label: t("admin.subjects"), type: "lookup", source: "subjects", parent: "courseId" },
        { name: "chapterId", label: t("admin.chapters"), type: "lookup", source: "chapters", parent: "courseId" },
        { name: "title", label: `${t("common.title")} (English)`, full: true },
        { name: "titleMr", label: `${t("common.title")} (मराठी)`, full: true },
        { name: "description", label: t("common.description"), type: "textarea", full: true },
      ],
    },
    {
      title: "File",
      hint: t("admin.pdfUrlHelp"),
      cols: 2,
      fields: [
        { name: "fileUrl", label: t("admin.pdfUrl"), placeholder: "https://storage…/notes.pdf", full: true },
        { name: "fileSizeKb", label: `${t("pdf.size")} (KB)`, type: "number" },
        { name: "pageCount", label: t("pdf.pages"), type: "number" },
        { name: "orderIndex", label: t("common.order"), type: "number" },
      ],
    },
    {
      title: `${t("admin.access")} & ${t("admin.publishing")}`,
      fields: [
        { name: "isFree", label: t("common.free"), type: "switch" },
        { name: "allowDownload", label: t("admin.allowDownload"), type: "switch", hint: "When off, the download button is hidden and no download URL is returned. Treat screenshot prevention only as a deterrent." },
        { name: "published", label: t("common.published"), type: "switch" },
      ],
    },
  ],
});

/* ------------------------------- Students ----------------------------- */
export const studentsConfig = (t) => ({
  readOnly: true,
  supportsPublish: false,
  defaultSort: "createdAt",
  filters: [
    { name: "state", label: t("common.status"), options: [{ value: "active", label: t("common.active") }, { value: "inactive", label: t("common.inactive") }] },
  ],
  defaults: {},
  columns: () => [
    {
      key: "name",
      label: t("common.title"),
      sortKey: "name",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{r.name}</p>
          <p className="truncate text-[11.5px] text-muted">{r.email} · {r.mobile}</p>
        </div>
      ),
    },
    { key: "coursesEnrolled", label: t("admin.courses"), render: (r) => <Badge tone="brand">{r.coursesEnrolled}</Badge> },
    { key: "lecturesCompleted", label: t("common.lectures"), render: (r) => <Badge tone="outline">{r.lecturesCompleted}</Badge> },
    { key: "quizzesAttempted", label: t("common.quizzes"), render: (r) => <Badge tone="outline">{r.quizzesAttempted}</Badge> },
    { key: "avgScore", label: t("admin.avgScore"), render: (r) => <span className="font-bold tabular-nums">{r.avgScore}%</span> },
    { key: "xp", label: "XP", sortKey: "xp", render: (r) => <span className="font-bold tabular-nums text-brand-700">{r.xp}</span> },
    { key: "status", label: t("common.status"), render: (r) => <Badge tone={r.status === "ACTIVE" ? "success" : "danger"}>{r.status === "ACTIVE" ? t("common.active") : t("common.inactive")}</Badge> },
    { key: "createdAt", label: t("common.createdAt"), sortKey: "createdAt", render: (r) => <span className="text-muted">{formatDate(r.createdAt)}</span> },
  ],
  rowActions: (row, { act }) => (
    <button
      onClick={() => act(row, row.status === "ACTIVE" ? "deactivate" : "reactivate")}
      className="rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-brand-700 transition hover:bg-brand-50"
    >
      {row.status === "ACTIVE" ? t("admin.deactivate") : t("admin.reactivate")}
    </button>
  ),
  sections: [],
});

/* ----------------------------- Notifications -------------------------- */
export const notificationsConfig = (t, tf) => ({
  createLabel: t("admin.sendNotification"),
  supportsPublish: false,
  defaultSort: "createdAt",
  filters: [],
  defaults: { title: "", titleMr: "", body: "", bodyMr: "", kind: "update", audience: "ALL", courseId: "" },
  columns: () => [
    { key: "title", label: t("common.title"), render: (r) => TitleCell(r, tf, r.body) },
    { key: "kind", label: "Type", render: (r) => <Badge tone="brand">{r.kind}</Badge> },
    { key: "audience", label: t("admin.audience"), render: (r) => <Badge tone="outline">{r.audience === "ALL" ? t("admin.audienceAll") : t("admin.audienceCourse")}</Badge> },
    { key: "createdAt", label: t("common.createdAt"), render: (r) => <span className="text-muted">{formatDate(r.createdAt)}</span> },
  ],
  sections: [
    {
      title: t("admin.basicInfo"),
      cols: 2,
      fields: [
        { name: "title", label: `${t("common.title")} (English)`, full: true },
        { name: "titleMr", label: `${t("common.title")} (मराठी)`, full: true },
        { name: "body", label: `${t("admin.body")} (English)`, type: "textarea", full: true },
        { name: "bodyMr", label: `${t("admin.body")} (मराठी)`, type: "textarea", full: true },
        {
          name: "kind", label: "Type", type: "select",
          options: [
            { value: "lecture", label: "New lecture" },
            { value: "quiz", label: "New test" },
            { value: "announcement", label: "Announcement" },
            { value: "update", label: "Important update" },
          ],
        },
        {
          name: "audience", label: t("admin.audience"), type: "select",
          options: [
            { value: "ALL", label: t("admin.audienceAll") },
            { value: "COURSE", label: t("admin.audienceCourse") },
          ],
        },
        { name: "courseId", label: t("admin.courses"), type: "lookup", source: "courses", showIf: (v) => v.audience === "COURSE", full: true },
      ],
    },
  ],
});
