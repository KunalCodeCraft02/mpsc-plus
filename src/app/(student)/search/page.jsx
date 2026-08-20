"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  X,
  Clock,
  TrendingUp,
  Sparkles,
  PlayCircle,
  FileText,
  ClipboardList,
  GraduationCap,
  Library,
  SlidersHorizontal,
} from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { searchService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import {
  Tabs,
  Badge,
  Button,
  Select,
  BottomSheet,
  Card,
  SkeletonList,
  EmptyState,
} from "@/components/ui";
import { CATEGORIES } from "@/lib/config";
import { formatPrice } from "@/lib/utils";

const RECENT_KEY = "mpscpulse.recentSearches";

const KIND_META = {
  course: { icon: GraduationCap, href: (r) => `/courses/${r.id}`, tone: "bg-brand-50 text-brand-600", label: "search.typeCourse" },
  lecture: { icon: PlayCircle, href: (r) => `/lectures/${r.id}`, tone: "bg-accent-50 text-accent-600", label: "search.typeLecture" },
  pdf: { icon: FileText, href: (r) => `/materials/${r.id}`, tone: "bg-amber-50 text-amber-600", label: "search.typePdf" },
  quiz: { icon: ClipboardList, href: (r) => `/tests/${r.id}`, tone: "bg-teal-50 text-teal-600", label: "search.typeQuiz" },
  subject: { icon: Library, href: (r) => `/courses/${r.courseId}`, tone: "bg-slate-100 text-slate-600", label: "search.typeSubject" },
  chapter: { icon: Library, href: (r) => `/courses/${r.courseId}`, tone: "bg-slate-100 text-slate-600", label: "search.typeChapter" },
};

const SUGGESTED = ["Indian Polity", "Polity MCQ", "Polity Notes", "Indian Constitution", "चालू घडामोडी", "मराठी व्याकरण"];

export default function SearchPage() {
  const { t, tf } = useI18n();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [data, setData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [popular, setPopular] = useState([]);
  const [sheet, setSheet] = useState(false);
  const [filters, setFilters] = useState({ access: "all", category: "all", language: "all" });
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      setRecent(JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]"));
    } catch {
      setRecent([]);
    }
    searchService.search({ q: "" }).then((d) => setPopular(d.popular || [])).catch(() => {});
    inputRef.current?.focus();
  }, []);

  const persistRecent = (term) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 8);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const runSearch = useCallback(
    async (term, type = tab) => {
      if (!term.trim()) {
        setData(null);
        return;
      }
      setLoading(true);
      try {
        const params = { q: term.trim(), type, perPage: 30 };
        Object.entries(filters).forEach(([k, v]) => {
          if (v && v !== "all") params[k] = v;
        });
        const res = await searchService.search(params);
        setData(res);
      } catch {
        setData({ items: [], counts: {}, total: 0 });
      } finally {
        setLoading(false);
      }
    },
    [tab, filters],
  );

  // live suggestions
  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const id = setTimeout(() => {
      searchService.suggest(q.trim()).then((d) => setSuggestions(d.suggestions || [])).catch(() => {});
    }, 200);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (!data) return;
    runSearch(data.query, tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filters]);

  const submit = (term) => {
    setQ(term);
    persistRecent(term);
    setSuggestions([]);
    runSearch(term);
  };

  const filterControls = (
    <div className="space-y-3">
      <Select
        label={t("admin.pricing")}
        value={filters.access}
        onChange={(e) => setFilters((f) => ({ ...f, access: e.target.value }))}
        options={[
          { value: "all", label: t("common.all") },
          { value: "free", label: t("common.free") },
          { value: "paid", label: t("common.paid") },
        ]}
      />
      <Select
        label={t("course.category")}
        value={filters.category}
        onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
        options={[{ value: "all", label: t("common.all") }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
      />
      <Select
        label={t("common.language")}
        value={filters.language}
        onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
        options={[
          { value: "all", label: t("common.all") },
          { value: "Marathi", label: "Marathi" },
          { value: "English", label: "English" },
          { value: "Bilingual", label: "Bilingual" },
        ]}
      />
    </div>
  );

  return (
    <StudentShell title={t("nav.search")} showSearch={false}>
      {/* Search field */}
      <div className="sticky top-14 z-20 -mx-3 mb-4 bg-[#f6f7fb]/95 px-3 py-2 backdrop-blur sm:-mx-5 sm:px-5 lg:top-16">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(q);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" style={{ height: 18, width: 18 }} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search.placeholder")}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-10 text-[14.5px] text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            />
            {q ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setData(null);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label={t("search.clear")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <Button variant="outline" size="icon" onClick={() => setSheet(true)} className="shrink-0" title={t("common.filters")}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </form>

        {suggestions.length && q.trim().length >= 2 && !loading ? (
          <Card padded={false} className="absolute inset-x-3 mt-1.5 overflow-hidden sm:inset-x-5">
            {suggestions.slice(0, 8).map((s, i) => {
              const meta = KIND_META[s.kind] || KIND_META.course;
              const Icon = s.kind === "popular" ? TrendingUp : meta.icon;
              const label = s.label || s.q;
              return (
                <button
                  key={`${s.kind}-${i}`}
                  onClick={() => submit(label)}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{label}</span>
                  {s.kind !== "popular" ? (
                    <Badge tone="outline" size="sm">
                      {t(meta.label)}
                    </Badge>
                  ) : null}
                </button>
              );
            })}
          </Card>
        ) : null}
      </div>

      {/* Empty / discovery state */}
      {!data ? (
        <div className="space-y-5">
          {recent.length ? (
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink">
                  <Clock className="h-4 w-4 text-brand-600" />
                  {t("search.recent")}
                </h2>
                <button
                  onClick={() => {
                    setRecent([]);
                    try {
                      window.localStorage.removeItem(RECENT_KEY);
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="text-[12px] font-bold text-brand-600 hover:underline"
                >
                  {t("search.clear")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => submit(r)}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-600 transition hover:border-brand-300"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {popular.length ? (
            <section>
              <h2 className="mb-2.5 flex items-center gap-2 text-[14px] font-bold text-ink">
                <TrendingUp className="h-4 w-4 text-accent-500" />
                {t("search.popular")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {popular.map((p) => (
                  <button
                    key={p}
                    onClick={() => submit(p)}
                    className="rounded-full bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-2.5 flex items-center gap-2 text-[14px] font-bold text-ink">
              <Sparkles className="h-4 w-4 text-teal-500" />
              {t("search.suggested")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-dashed border-slate-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-600 transition hover:border-brand-400 hover:text-brand-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <>
          <Tabs
            className="mb-4"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "all", label: t("search.tabsAll"), count: data.counts?.all },
              { value: "courses", label: t("search.tabsCourses"), count: data.counts?.courses },
              { value: "lectures", label: t("search.tabsLectures"), count: data.counts?.lectures },
              { value: "pdfs", label: t("search.tabsPdfs"), count: data.counts?.pdfs },
              { value: "quizzes", label: t("search.tabsQuizzes"), count: data.counts?.quizzes },
            ]}
          />

          <p className="mb-3 text-[12.5px] text-muted">
            {data.total} {t("common.results")} · {t("search.resultsFor")} “{data.query}”
          </p>

          {loading ? (
            <SkeletonList rows={5} />
          ) : data.items.length ? (
            <div className="space-y-2.5">
              {data.items.map((r) => {
                const meta = KIND_META[r.kind] || KIND_META.course;
                const Icon = meta.icon;
                return (
                  <Link
                    key={`${r.kind}-${r.id}`}
                    href={meta.href(r)}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-soft transition hover:border-brand-200 hover:shadow-card"
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-[13.5px] font-bold text-ink group-hover:text-brand-700">
                        {tf(r, "title")}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                        <Badge tone="outline" size="sm">
                          {t(meta.label)}
                        </Badge>
                        {r.courseTitle ? <span className="truncate">{r.courseTitle}</span> : null}
                      </div>
                    </div>
                    <span className="shrink-0 text-[12px] font-bold text-ink">
                      {r.isFree ? t("common.free") : r.price ? formatPrice(r.price, r.currency) : t("common.paid")}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={SearchIcon}
              title={t("search.emptyTitle")}
              description={t("search.emptySub")}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {(popular.length ? popular : SUGGESTED).slice(0, 4).map((p) => (
                    <button
                      key={p}
                      onClick={() => submit(p)}
                      className="rounded-full bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              }
            />
          )}
        </>
      )}

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title={t("common.filters")}>
        {filterControls}
        <Button fullWidth className="mt-4" onClick={() => setSheet(false)}>
          {t("common.apply")}
        </Button>
      </BottomSheet>
    </StudentShell>
  );
}
