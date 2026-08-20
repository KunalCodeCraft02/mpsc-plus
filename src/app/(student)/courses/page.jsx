"use client";

import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal, GraduationCap } from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { catalogService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import {
  Chip,
  Button,
  Select,
  BottomSheet,
  SkeletonCard,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { Pagination } from "@/components/admin/DataTable";
import { CourseCard } from "@/components/cards/ContentCards";

export default function CoursesPage() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("all");
  const [access, setAccess] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(() => {
    setError(null);
    catalogService
      .courses({ category, access, sort, page, perPage: 12 })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [category, access, sort, page]);

  useEffect(load, [load]);
  useEffect(() => setPage(1), [category, access, sort]);

  const categories = data?.facets?.categories || [];

  const filters = (
    <div className="space-y-3">
      <Select
        label={t("admin.pricing")}
        value={access}
        onChange={(e) => setAccess(e.target.value)}
        options={[
          { value: "all", label: t("common.all") },
          { value: "free", label: t("common.free") },
          { value: "paid", label: t("common.paid") },
        ]}
      />
      <Select
        label={t("common.sort")}
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        options={[
          { value: "newest", label: "Newest first" },
          { value: "title", label: "A → Z" },
          { value: "price_asc", label: "Price: low to high" },
          { value: "price_desc", label: "Price: high to low" },
        ]}
      />
    </div>
  );

  return (
    <StudentShell title={t("nav.courses")} wide>
      <div className="mb-4 flex items-center gap-2">
        <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto pb-1">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            {t("common.all")}
          </Chip>
          {categories.map((c) => (
            <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
              {c.value} <span className="opacity-60">{c.count}</span>
            </Chip>
          ))}
        </div>
        <Button variant="outline" size="sm" leftIcon={SlidersHorizontal} onClick={() => setSheet(true)} className="shrink-0 lg:hidden">
          {t("common.filter")}
        </Button>
      </div>

      <div className="mb-4 hidden max-w-xl gap-3 lg:flex">{filters}</div>

      {error ? (
        <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
      ) : !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data.items.length ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((c) => (
              <CourseCard key={c.id} course={c} />
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
        <EmptyState icon={GraduationCap} title={t("common.noResults")} description={t("search.emptySub")} />
      )}

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title={t("common.filters")}>
        {filters}
        <Button fullWidth className="mt-4" onClick={() => setSheet(false)}>
          {t("common.apply")}
        </Button>
      </BottomSheet>
    </StudentShell>
  );
}
