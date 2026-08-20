"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import api from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { Chip, SkeletonList, EmptyState, ErrorState, Input } from "@/components/ui";
import { Pagination } from "@/components/admin/DataTable";
import { PDFCard } from "@/components/cards/ContentCards";

export default function MaterialsPage() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [access, setAccess] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setError(null);
    const params = { page, perPage: 24 };
    if (q.trim()) params.q = q.trim();
    if (access !== "all") params.access = access;
    api
      .get("/pdfs", { params })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message));
  }, [q, access, page]);

  useEffect(() => {
    const id = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  useEffect(() => setPage(1), [q, access]);

  return (
    <StudentShell title={t("pdf.viewer")} wide>
      <div className="mb-4 space-y-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`${t("common.search")} ${t("nav.downloads").toLowerCase()}…`}
          leftIcon={Search}
        />
        <div className="flex gap-2">
          {[
            { value: "all", label: t("common.all") },
            { value: "free", label: t("common.free") },
            { value: "paid", label: t("common.paid") },
          ].map((f) => (
            <Chip key={f.value} active={access === f.value} onClick={() => setAccess(f.value)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
      ) : !data ? (
        <SkeletonList rows={6} />
      ) : data.items.length ? (
        <>
          <div className="grid gap-2.5 lg:grid-cols-2">
            {data.items.map((p) => (
              <PDFCard key={p.id} pdf={p} locked={p.locked} />
            ))}
          </div>
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            perPage={data.perPage}
            onChange={setPage}
            labels={{ of: t("common.of"), results: t("common.results") }}
          />
        </>
      ) : (
        <EmptyState icon={FileText} title={t("common.noResults")} description={t("search.emptySub")} />
      )}
    </StudentShell>
  );
}
