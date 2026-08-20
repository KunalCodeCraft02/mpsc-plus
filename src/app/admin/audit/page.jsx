"use client";

import { useCallback, useEffect, useState } from "react";
import { History } from "lucide-react";
import { AdminShell, AdminSearchInput } from "@/components/layout/AdminShell";
import { DataTable, Pagination } from "@/components/admin/DataTable";
import { adminService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { Card, Select, Badge, EmptyState, ErrorState } from "@/components/ui";
import { formatDate } from "@/lib/utils";

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "PUBLISH", "UNPUBLISH", "DUPLICATE", "MAKEFREE", "MAKEPAID"];
const ENTITIES = ["courses", "subjects", "chapters", "lectures", "pdfs", "quizzes", "students", "notifications"];

export default function AdminAuditPage() {
  const { t } = useI18n();
  const [state, setState] = useState({ items: [], total: 0, page: 1, pages: 1, perPage: 20 });
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");
  const [action, setAction] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, perPage: 20 };
      if (q.trim()) params.q = q.trim();
      if (entity !== "all") params.entity = entity;
      if (action !== "all") params.action = action;
      setState(await adminService.audit(params));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, q, entity, action]);

  useEffect(() => {
    const id = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  const columns = [
    { key: "createdAt", label: "When", render: (r) => <span className="text-muted">{formatDate(r.createdAt)}</span> },
    { key: "adminName", label: "Admin", render: (r) => <span className="font-semibold text-ink">{r.adminName}</span> },
    { key: "action", label: "Action", render: (r) => <Badge tone="brand">{r.action}</Badge> },
    { key: "entity", label: "Content", render: (r) => <Badge tone="outline">{r.entity} #{r.entityId}</Badge> },
    { key: "detail", label: "Detail", render: (r) => <span className="text-muted">{r.detail}</span> },
  ];

  return (
    <AdminShell
      title={t("admin.auditLog")}
      subtitle="Every content change is recorded with admin, action and timestamp"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.auditLog") }]}
    >
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-end gap-2.5">
            <AdminSearchInput value={q} onChange={setQ} placeholder="Search activity…" />
            <Select
              label="Content"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              options={[{ value: "all", label: t("common.all") }, ...ENTITIES.map((e) => ({ value: e, label: e }))]}
              wrapperClassName="w-full sm:w-44"
            />
            <Select
              label="Action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              options={[{ value: "all", label: t("common.all") }, ...ACTIONS.map((a) => ({ value: a, label: a }))]}
              wrapperClassName="w-full sm:w-44"
            />
          </div>
        </Card>

        {error ? (
          <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={state.items}
              loading={loading}
              empty={<EmptyState icon={History} title="No activity yet" description="Admin actions will be logged here." />}
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
      </div>
    </AdminShell>
  );
}
