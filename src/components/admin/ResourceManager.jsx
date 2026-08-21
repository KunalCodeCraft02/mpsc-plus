"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Filter,
  RotateCcw,
  Tag,
} from "lucide-react";
import { ThumbnailField } from "./ThumbnailField";
import { adminService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  Input,
  Textarea,
  Select,
  Switch,
  Badge,
  StatusBadge,
  Chip,
  Modal,
  Drawer,
  ConfirmDialog,
  BottomSheet,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { AdminSearchInput } from "@/components/layout/AdminShell";
import { DataTable, Pagination, RowActions } from "./DataTable";

/* ------------------------------- Lookups ------------------------------ */
export function useLookups(enabled = true) {
  const [data, setData] = useState({ courses: [], subjects: [], chapters: [] });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    Promise.all([
      adminService.list("courses", { perPage: 100 }),
      adminService.list("subjects", { perPage: 200 }),
      adminService.list("chapters", { perPage: 300 }),
    ])
      .then(([c, s, ch]) => {
        if (!alive) return;
        setData({ courses: c.items || [], subjects: s.items || [], chapters: ch.items || [] });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);
  return data;
}

/* ------------------------------ Field render -------------------------- */
function Field({ field, form, lookups, t }) {
  const { register, watch, setValue, formState } = form;
  const err = formState.errors?.[field.name]?.message;
  const value = watch(field.name);

  if (field.type === "thumbnail") {
    return (
      <ThumbnailField
        name={field.name}
        value={value}
        error={err}
        setValue={setValue}
        t={t}
      />
    );
  }

  if (field.type === "switch") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
        <Switch
          checked={!!value}
          onChange={(v) => setValue(field.name, v, { shouldDirty: true })}
          label={field.label}
          description={field.hint}
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        label={field.label}
        hint={field.hint}
        error={err}
        rows={field.rows || 4}
        placeholder={field.placeholder}
        {...register(field.name)}
      />
    );
  }

  if (field.type === "select" || field.type === "lookup") {
    let options = field.options || [];
    if (field.type === "lookup") {
      const src = lookups[field.source] || [];
      const parentValue = field.parent ? Number(watch(field.parent)) : null;
      const filtered = field.parent
        ? src.filter((r) => Number(r[field.parentKey || "courseId"]) === parentValue)
        : src;
      options = filtered.map((r) => ({ value: r.id, label: r.title || r.name }));
    }
    return (
      <Select
        label={field.label}
        hint={field.hint}
        error={err}
        placeholder={field.placeholder || `${t("common.all")}…`}
        options={options}
        {...register(field.name)}
      />
    );
  }

  return (
    <Input
      label={field.label}
      hint={field.hint}
      error={err}
      type={field.type === "number" ? "number" : "text"}
      step={field.step}
      placeholder={field.placeholder}
      {...register(field.name)}
    />
  );
}

/* --------------------------- Resource manager ------------------------- */
export function ResourceManager({ entity, config, renderExtra }) {
  const { t, tf } = useI18n();
  const toast = useToast();
  const lookups = useLookups(config.needsLookups !== false);

  const [state, setState] = useState({ items: [], total: 0, page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState(config.initialFilters || {});
  const [sort, setSort] = useState(config.defaultSort || "createdAt");
  const [dir, setDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const form = useForm({ defaultValues: config.defaults });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, perPage: config.perPage || 10, sort, dir, ...filters };
      if (q.trim()) params.q = q.trim();
      Object.keys(params).forEach((k) => {
        if (params[k] === "" || params[k] === "all" || params[k] == null) delete params[k];
      });
      const data = await adminService.list(entity, params);
      setState(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [entity, page, sort, dir, filters, q, config.perPage]);

  useEffect(() => {
    const id = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  useEffect(() => {
    setPage(1);
  }, [q, filters]);

  const openNew = () => {
    form.reset(config.defaults);
    setEditing("new");
  };

  const openEdit = async (row) => {
    try {
      const { item } = await adminService.get(entity, row.id);
      let values = config.toForm ? config.toForm(item) : { ...config.defaults, ...item };
      if (config.afterLoad) values = await config.afterLoad(values, item);
      form.reset(values);
      setEditing(item);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submit = form.handleSubmit(async (values) => {
    if (config.validate) {
      const message = config.validate(values);
      if (message) {
        toast.error(message);
        return;
      }
    }
    setBusy(true);
    try {
      const payload = config.fromForm ? config.fromForm(values) : values;
      let id = editing?.id;
      if (editing === "new") {
        const { item } = await adminService.create(entity, payload);
        id = item.id;
        // If afterSave then fails, the drawer stays open — flip editing to the
        // created row so a retry updates it instead of creating a duplicate.
        setEditing(item);
        toast.success(t("admin.created"));
      } else {
        await adminService.update(entity, editing.id, payload);
        toast.success(t("admin.saved"));
      }
      if (config.afterSave) await config.afterSave(id, values);
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.message);
      const issues = e.data?.issues || [];
      issues.forEach((i) => i.path && form.setError(i.path, { message: i.message }));
    } finally {
      setBusy(false);
    }
  });

  const act = async (row, action, extra = {}) => {
    try {
      await adminService.update(entity, row.id, { __action: action, ...extra });
      toast.success(t("admin.saved"));
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await adminService.remove(entity, confirm.id);
      toast.success(t("admin.deleted"));
      setConfirm(null);
      setSelected([]);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const bulk = async (action) => {
    if (!selected.length) return;
    setBusy(true);
    try {
      await adminService.bulk(entity, { action, ids: selected });
      toast.success(`${selected.length} ${t("admin.selected")}`);
      setSelected([]);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const filterDefs = useMemo(() => config.filters || [], [config.filters]);

  const filterControls = (
    <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-end">
      {filterDefs.map((f) => {
        let options = f.options || [];
        if (f.source) {
          options = (lookups[f.source] || []).map((r) => ({ value: r.id, label: r.title || r.name }));
        }
        return (
          <Select
            key={f.name}
            label={f.label}
            value={filters[f.name] ?? "all"}
            onChange={(e) => setFilters((prev) => ({ ...prev, [f.name]: e.target.value }))}
            options={[{ value: "all", label: f.allLabel || t("common.all") }, ...options]}
            wrapperClassName="lg:w-44"
          />
        );
      })}
      <Button
        variant="outline"
        size="md"
        leftIcon={RotateCcw}
        onClick={() => {
          setFilters(config.initialFilters || {});
          setQ("");
        }}
      >
        {t("common.reset")}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {renderExtra ? renderExtra({ reload: load, state }) : null}

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-soft">
        <div className="flex flex-wrap items-center gap-2.5">
          <AdminSearchInput value={q} onChange={setQ} placeholder={config.searchPlaceholder || t("common.search")} />
          <Button
            variant="outline"
            size="md"
            leftIcon={Filter}
            className="lg:hidden"
            onClick={() => setSheetOpen(true)}
          >
            {t("common.filters")}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {selected.length ? (
              <>
                <Badge tone="brand">
                  {selected.length} {t("admin.selected")}
                </Badge>
                {config.supportsPublish !== false ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => bulk("publish")}>
                      {t("common.publish")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => bulk("unpublish")}>
                      {t("common.unpublish")}
                    </Button>
                  </>
                ) : null}
                {config.readOnly ? null : (
                  <Button size="sm" variant="danger" onClick={() => bulk("delete")}>
                    {t("common.delete")}
                  </Button>
                )}
              </>
            ) : null}
            {config.readOnly ? null : (
              <Button size="md" leftIcon={Plus} onClick={openNew}>
                {config.createLabel || t("common.create")}
              </Button>
            )}
          </div>
        </div>
        {filterDefs.length ? <div className="mt-3.5 hidden lg:block">{filterControls}</div> : null}
      </div>

      {error ? (
        <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
      ) : (
        <>
          <DataTable
            columns={config.columns({ t, tf })}
            rows={state.items}
            loading={loading}
            selectable={!config.readOnly}
            selected={selected}
            onSelectChange={setSelected}
            sort={sort}
            dir={dir}
            onSortChange={(key) => {
              if (sort === key) setDir(dir === "asc" ? "desc" : "asc");
              else {
                setSort(key);
                setDir("desc");
              }
            }}
            empty={
              <EmptyState
                title={config.emptyTitle || t("common.noResults")}
                description={config.emptyBody}
                action={
                  config.readOnly ? null : (
                    <Button leftIcon={Plus} onClick={openNew}>
                      {config.createLabel || t("common.create")}
                    </Button>
                  )
                }
              />
            }
            renderCard={config.renderCard ? (row) => config.renderCard(row, { t, tf }) : undefined}
            actions={(row) => (
              <RowActions>
                {config.previewHref ? (
                  <Button
                    as="a"
                    href={config.previewHref(row)}
                    target="_blank"
                    rel="noreferrer"
                    variant="ghost"
                    size="icon"
                    title={t("common.preview")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ) : null}
                {config.supportsPublish !== false ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    title={row.published ? t("common.unpublish") : t("common.publish")}
                    onClick={() => act(row, row.published ? "unpublish" : "publish")}
                  >
                    {row.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                ) : null}
                {config.supportsPricing ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    title={row.isFree ? t("common.paid") : t("common.free")}
                    onClick={() => act(row, row.isFree ? "makePaid" : "makeFree")}
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                ) : null}
                {config.supportsDuplicate ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t("common.duplicate")}
                    onClick={() => act(row, "duplicate")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                ) : null}
                {config.rowActions ? config.rowActions(row, { act, reload: load }) : null}
                {config.readOnly ? null : (
                  <>
                    <Button variant="ghost" size="icon" title={t("common.edit")} onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("common.delete")}
                      className="text-accent-600 hover:bg-accent-50"
                      onClick={() => setConfirm(row)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
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

      {/* Mobile filters */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t("common.filters")}>
        <div className="space-y-3 pb-2">{filterControls}</div>
      </BottomSheet>

      {/* Create / edit */}
      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? config.createLabel || t("common.create") : t("common.edit")}
        description={config.formDescription}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" loading={busy} onClick={submit}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-6">
          {(config.sections || []).map((section) => (
            <section key={section.title}>
              <h4 className="mb-0.5 text-[13px] font-bold uppercase tracking-wide text-brand-700">
                {section.title}
              </h4>
              {section.hint ? <p className="mb-3 text-[12px] text-muted">{section.hint}</p> : <div className="mb-3" />}
              {section.render ? (
                section.render({ form, t })
              ) : (
                <div className={section.cols === 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
                  {section.fields
                    .filter((f) => !f.showIf || f.showIf(form.watch()))
                    .map((f) => (
                      <div key={f.name} className={f.full ? "sm:col-span-2" : undefined}>
                        <Field field={f} form={form} lookups={lookups} t={t} />
                      </div>
                    ))}
                </div>
              )}
            </section>
          ))}
          {config.renderPreview ? (
            <section>
              <h4 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-brand-700">
                {t("admin.livePreview")}
              </h4>
              {config.renderPreview(form.watch())}
            </section>
          ) : null}
        </form>
      </Drawer>

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
  );
}

export { StatusBadge, Modal };
