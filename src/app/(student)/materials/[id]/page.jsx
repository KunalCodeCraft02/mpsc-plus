"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Download, ExternalLink, FileText, ShieldAlert, ArrowLeft, Layers } from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { catalogService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { Card, Badge, Button, SectionHeader, PageLoader, ErrorState, Alert } from "@/components/ui";
import { formatFileSize } from "@/lib/utils";
import { openExternalUrl } from "@/lib/nativeLinks";

export default function PdfViewerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, tf } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    catalogService
      .pdf(id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <StudentShell title={t("pdf.viewer")}>
        <ErrorState
          title={t("common.somethingWrong")}
          description={error}
          onRetry={() => router.push("/materials")}
          retryLabel={t("nav.downloads")}
        />
      </StudentShell>
    );
  }
  if (!data) {
    return (
      <StudentShell title={t("pdf.viewer")}>
        <PageLoader />
      </StudentShell>
    );
  }

  const { pdf, course, chapter, subject } = data;

  return (
    <StudentShell title={t("pdf.viewer")}>
      <Card>
        <div className="flex items-start gap-3.5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
            <FileText className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={pdf.isFree ? "teal" : "amber"}>{pdf.isFree ? t("common.free") : t("common.paid")}</Badge>
              {pdf.pageCount ? <Badge tone="outline">{pdf.pageCount} {t("pdf.pages")}</Badge> : null}
              {pdf.fileSizeKb ? <Badge tone="outline">{formatFileSize(pdf.fileSizeKb)}</Badge> : null}
            </div>
            <h1 className="mt-2 text-lg font-bold leading-snug tracking-tight text-ink sm:text-xl">
              {tf(pdf, "title")}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
              {course ? (
                <Link href={`/courses/${course.id}`} className="font-semibold text-brand-600 hover:underline">
                  {tf(course, "title")}
                </Link>
              ) : null}
              {subject ? <span>· {tf(subject, "name")}</span> : null}
              {chapter ? (
                <span className="inline-flex items-center gap-1">
                  · <Layers className="h-3 w-3" /> {tf(chapter, "title")}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {pdf.description ? (
          <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-slate-700">
            {pdf.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button onClick={() => openExternalUrl(pdf.fileUrl)} leftIcon={ExternalLink}>
            {t("pdf.open")}
          </Button>
          {pdf.allowDownload && pdf.downloadUrl ? (
            <Button
              onClick={() => openExternalUrl(pdf.downloadUrl)}
              variant="outline"
              leftIcon={Download}
            >
              {t("pdf.download")}
            </Button>
          ) : (
            <Button variant="outline" disabled leftIcon={ShieldAlert}>
              {t("pdf.downloadDisabled")}
            </Button>
          )}
        </div>
      </Card>

      {/* Inline viewer */}
      <Card className="mt-4" padded={false}>
        <div className="border-b border-slate-100 p-3.5">
          <SectionHeader title={t("pdf.viewer")} subtitle={pdf.fileUrl} className="mb-0" />
        </div>
        <div className="aspect-[3/4] w-full bg-slate-100 sm:aspect-[4/3]">
          <object data={pdf.fileUrl} type="application/pdf" className="h-full w-full">
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <p className="text-[13.5px] text-muted">
                Your browser cannot display this PDF inline. Use “{t("pdf.open")}” to view it in a new
                tab.
              </p>
              <Button onClick={() => openExternalUrl(pdf.fileUrl)} size="sm">
                {t("pdf.open")}
              </Button>
            </div>
          </object>
        </div>
      </Card>

      {!pdf.allowDownload ? (
        <Alert tone="warning" className="mt-4" title="About content protection">
          Downloads are disabled for this material, so the server does not return a download URL.
          Any client-side deterrent against screenshots is only a deterrent — it is not a guarantee.
        </Alert>
      ) : null}

      <Button as={Link} href="/materials" variant="ghost" size="sm" className="mt-4" leftIcon={ArrowLeft}>
        {t("nav.downloads")}
      </Button>
    </StudentShell>
  );
}
