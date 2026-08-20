"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, EyeOff, Copy, Layers, BarChart3 } from "lucide-react";
import { AdminShell, AdminSearchInput } from "@/components/layout/AdminShell";
import { DataTable, Pagination, RowActions } from "@/components/admin/DataTable";
import { useLookups } from "@/components/admin/ResourceManager";
import { adminService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  Badge,
  Select,
  StatusBadge,
  ConfirmDialog,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default function AdminQuizzesPage() {
  const { t, tf } = useI18n();
  const toast = useToast();
  const lookups = useLookups();

  const [state, setState] = useState({ items: [], total: 0, page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ courseId: "all", status: "all", access: "all" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, perPage: 10 };
      if (q.trim()) params.q = q.trim();
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== "all") params[k] = v;
      });
      setState(await adminService.list("quizzes", params));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, q, filters]);

  useEffect(() => {
    const id = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  const act = async (row, action) => {
    try {
      await adminService.update("quizzes", row.id, { __action: action });
      toast.success(t("admin.saved"));
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await adminService.remove("quizzes", confirm.id);
      toast.success(t("admin.deleted"));
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const bulk = async (action) => {
    if (!selected.length) return;
    try {
      await adminService.bulk("quizzes", { action, ids: selected });
      toast.success(`${selected.length} ${t("admin.selected")}`);
      setSelected([]);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    {
      key: "title",
      label: t("common.title"),
      render: (r) => (
        <Link href={`/admin/quizzes/${r.id}`} className="block min-w-0">
          <p className="truncate font-semibold text-ink hover:text-brand-700">{tf(r, "title")}</p>
          <p className="truncate text-[11.5px] text-muted">{r.courseTitle || "—"}</p>
        </Link>
      ),
    },
    {
      key: "difficulty",
      label: t("tests.difficulty"),
      render: (r) => (
        <Badge tone={r.difficulty === "easy" ? "teal" : r.difficulty === "hard" ? "danger" : "amber"}>
          {t(`tests.${r.difficulty}`)}
        </Badge>
      ),
    },
    { key: "questionCount", label: t("tests.questions"), render: (r) => <Badge tone="brand" icon={Layers}>{r.questionCount}</Badge> },
    { key: "attemptCount", label: t("admin.attempts"), render: (r) => <Badge tone="outline" icon={BarChart3}>{r.attemptCount}</Badge> },
    { key: "timeLimitMin", label: t("tests.timeLimit"), render: (r) => <span className="tabular-nums text-muted">{r.timeLimitMin} {t("common.minutes")}</span> },
    { key: "isFree", label: t("admin.pricing"), render: (r) => <Badge tone={r.isFree ? "teal" : "amber"}>{r.isFree ? t("common.free") : t("common.paid")}</Badge> },
    { key: "published", label: t("common.status"), render: (r) => <StatusBadge published={r.published} labels={{ published: t("common.published"), draft: t("common.draft") }} /> },
    { key: "createdAt", label: t("common.createdAt"), render: (r) => <span className="text-muted">{formatDate(r.createdAt)}</span> },
  ];

  return (
    <AdminShell
      title={t("admin.quizzes")}
      subtitle="Build tests, manage questions and review performance"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.quizzes") }]}
      actions={
        <Button as={Link} href="/admin/quizzes/new" leftIcon={Plus}>
          {t("admin.newQuiz")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-soft">
          <div className="flex flex-wrap items-end gap-2.5">
            <AdminSearchInput value={q} onChange={setQ} placeholder={`${t("common.search")} ${t("admin.quizzes").toLowerCase()}…`} />
            <Select
              value={filters.courseId}
              onChange={(e) => setFilters((f) => ({ ...f, courseId: e.target.value }))}
              options={[{ value: "all", label: t("common.all") }, ...lookups.courses.map((c) => ({ value: c.id, label: c.title }))]}
              wrapperClassName="w-full sm:w-52"
              label={t("admin.courses")}
            />
            <Select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: "all", label: t("common.all") },
                { value: "published", label: t("common.published") },
                { value: "draft", label: t("common.draft") },
              ]}
              wrapperClassName="w-full sm:w-40"
              label={t("common.status")}
            />
            <Select
              value={filters.access}
              onChange={(e) => setFilters((f) => ({ ...f, access: e.target.value }))}
              options={[
                { value: "all", label: t("common.all") },
                { value: "free", label: t("common.free") },
                { value: "paid", label: t("common.paid") },
              ]}
              wrapperClassName="w-full sm:w-36"
              label={t("admin.pricing")}
            />
            {selected.length ? (
              <div className="ml-auto flex items-center gap-2">
                <Badge tone="brand">{selected.length} {t("admin.selected")}</Badge>
                <Button size="sm" variant="outline" onClick={() => bulk("publish")}>{t("common.publish")}</Button>
                <Button size="sm" variant="outline" onClick={() => bulk("unpublish")}>{t("common.unpublish")}</Button>
                <Button size="sm" variant="danger" onClick={() => bulk("delete")}>{t("common.delete")}</Button>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={state.items}
              loading={loading}
              selectable
              selected={selected}
              onSelectChange={setSelected}
              empty={
                <EmptyState
                  title={t("tests.empty")}
                  description="Create your first test with the question builder."
                  action={<Button as={Link} href="/admin/quizzes/new" leftIcon={Plus}>{t("admin.newQuiz")}</Button>}
                />
              }
              renderCard={(r) => (
                <div className="space-y-2.5">
                  <Link href={`/admin/quizzes/${r.id}`}>
                    <p className="font-bold leading-snug text-ink">{tf(r, "title")}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted">{r.courseTitle}</p>
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge published={r.published} labels={{ published: t("common.published"), draft: t("common.draft") }} />
                    <Badge tone="brand">{r.questionCount} {t("tests.questions")}</Badge>
                    <Badge tone="outline">{r.attemptCount} {t("admin.attempts")}</Badge>
                  </div>
                </div>
              )}
              actions={(row) => (
                <RowActions>
                  <Button as={Link} href={`/tests/${row.id}`} target="_blank" variant="ghost" size="icon" title={t("common.preview")}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title={row.published ? t("common.unpublish") : t("common.publish")} onClick={() => act(row, row.published ? "unpublish" : "publish")}>
                    {row.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" title={t("common.duplicate")} onClick={() => act(row, "duplicate")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button as={Link} href={`/admin/quizzes/${row.id}`} variant="ghost" size="icon" title={t("common.edit")}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-accent-600 hover:bg-accent-50" title={t("common.delete")} onClick={() => setConfirm(row)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </RowActions>
              )}
            />
            <Pagination
              page={state.page}
              pages={state.pages}
              total={state.total}
              perPage={state.perPage}
              onChange={setPage}
              labels={{ of: t("common.of"), results: t("common.results") }}
            />
          </>
        )}

        <ConfirmDialog
          open={!!confirm}
          onClose={() => setConfirm(null)}
          onConfirm={remove}
          loading={busy}
          title={t("common.confirmDelete")}
          body={t("common.confirmDeleteBody")}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
        />
      </div>
    </AdminShell>
  );
}
