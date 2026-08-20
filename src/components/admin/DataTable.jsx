"use client";

import { ChevronLeft, ChevronRight, ArrowUpDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox, SkeletonTable, EmptyState } from "@/components/ui";

export function DataTable({
  columns = [],
  rows = [],
  loading,
  rowKey = (r) => r.id,
  selectable = false,
  selected = [],
  onSelectChange,
  sort,
  dir = "desc",
  onSortChange,
  empty,
  renderCard,
  actions,
}) {
  if (loading) return <SkeletonTable rows={6} cols={Math.min(6, columns.length + 1)} />;
  if (!rows.length) return empty || <EmptyState title="Nothing here yet" />;

  const allSelected = selectable && rows.length > 0 && rows.every((r) => selected.includes(rowKey(r)));

  const toggleAll = () => {
    if (!onSelectChange) return;
    onSelectChange(allSelected ? [] : rows.map(rowKey));
  };
  const toggleOne = (id) => {
    if (!onSelectChange) return;
    onSelectChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {selectable ? (
                  <th className="w-10 px-4 py-3">
                    <Checkbox checked={allSelected} onChange={toggleAll} />
                  </th>
                ) : null}
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted",
                      c.className,
                    )}
                  >
                    {c.sortKey ? (
                      <button
                        onClick={() => onSortChange?.(c.sortKey)}
                        className={cn(
                          "inline-flex items-center gap-1 transition hover:text-brand-600",
                          sort === c.sortKey && "text-brand-600",
                        )}
                      >
                        {c.label}
                        <ArrowUpDown className="h-3 w-3" />
                        {sort === c.sortKey ? (
                          <span className="text-[9px]">{dir === "asc" ? "▲" : "▼"}</span>
                        ) : null}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
                {actions ? <th className="w-px px-4 py-3" /> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = rowKey(row);
                return (
                  <tr
                    key={id}
                    className={cn(
                      "border-b border-slate-50 transition last:border-0 hover:bg-slate-50/60",
                      selected.includes(id) && "bg-brand-50/40",
                    )}
                  >
                    {selectable ? (
                      <td className="px-4 py-3">
                        <Checkbox checked={selected.includes(id)} onChange={() => toggleOne(id)} />
                      </td>
                    ) : null}
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 text-[13px] text-ink", c.cellClassName)}>
                        {c.render ? c.render(row) : row[c.key]}
                      </td>
                    ))}
                    {actions ? (
                      <td className="px-4 py-3 text-right">{actions(row)}</td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2.5 lg:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-soft"
          >
            {renderCard ? (
              renderCard(row)
            ) : (
              <div className="space-y-2">
                {columns.slice(0, 4).map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {c.label}
                    </span>
                    <span className="min-w-0 text-right text-[13px] text-ink">
                      {c.render ? c.render(row) : row[c.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {actions ? (
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                {actions(row)}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

export function Pagination({ page, pages, total, perPage, onChange, labels }) {
  if (total === 0) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  const nums = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  for (let i = start; i <= Math.min(pages, start + 4); i += 1) nums.push(i);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[12px] text-muted">
        {from}–{to} {labels?.of || "of"} {total} {labels?.results || "results"}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition enabled:hover:border-brand-300 enabled:hover:text-brand-600 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {nums.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              "h-9 min-w-9 rounded-lg px-2.5 text-[12.5px] font-bold transition",
              n === page
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300",
            )}
          >
            {n}
          </button>
        ))}
        <button
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition enabled:hover:border-brand-300 enabled:hover:text-brand-600 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function RowActions({ children }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

export { MoreVertical };
