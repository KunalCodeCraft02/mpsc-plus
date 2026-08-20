"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, SlidersHorizontal } from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { catalogService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { Tabs, Select, Button, BottomSheet, SkeletonList, EmptyState, ErrorState } from "@/components/ui";
import { QuizCard } from "@/components/cards/ContentCards";

export default function TestsPage() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("available");
  const [difficulty, setDifficulty] = useState("all");
  const [access, setAccess] = useState("all");
  const [sheet, setSheet] = useState(false);

  const load = useCallback(() => {
    setError(null);
    catalogService
      .quizzes({ difficulty, access, perPage: 50 })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [difficulty, access]);

  useEffect(load, [load]);

  const items = data?.items || [];
  const list = tab === "attempted" ? items.filter((q) => q.attempt) : items;

  const filters = (
    <div className="space-y-3">
      <Select
        label={t("tests.difficulty")}
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        options={[
          { value: "all", label: t("common.all") },
          { value: "easy", label: t("tests.easy") },
          { value: "medium", label: t("tests.medium") },
          { value: "hard", label: t("tests.hard") },
        ]}
      />
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
    </div>
  );

  return (
    <StudentShell title={t("tests.title")}>
      <div className="mb-4 flex items-center gap-2">
        <Tabs
          className="flex-1"
          fill
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "available", label: t("tests.available"), count: items.length },
            { value: "attempted", label: t("tests.attempted"), count: items.filter((q) => q.attempt).length },
          ]}
        />
        <Button variant="outline" size="icon" onClick={() => setSheet(true)} className="shrink-0 lg:hidden" title={t("common.filters")}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4 hidden max-w-lg gap-3 lg:flex">{filters}</div>

      {error ? (
        <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
      ) : !data ? (
        <SkeletonList rows={5} />
      ) : list.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((q) => (
            <QuizCard key={q.id} quiz={q} attempt={q.attempt} />
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardCheck} title={t("tests.empty")} description={t("tests.emptySub")} />
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
