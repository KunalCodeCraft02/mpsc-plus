"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Eye,
  CheckCircle2,
  ClipboardList,
  BarChart3,
  Clock,
  Target,
  TrendingDown,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { useLookups } from "@/components/admin/ResourceManager";
import { adminService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  Input,
  Textarea,
  Select,
  Switch,
  Card,
  Badge,
  SectionHeader,
  Modal,
  PageLoader,
  StatTile,
  Alert,
  Tabs,
} from "@/components/ui";
import { formatSeconds } from "@/lib/utils";

const emptyQuestion = () => ({
  key: Math.random().toString(36).slice(2),
  text: "",
  textMr: "",
  options: ["", "", "", ""],
  optionsMr: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
  marks: 2,
  negativeMarks: 0,
});

export default function QuizBuilderPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const router = useRouter();
  const { t, tf } = useI18n();
  const toast = useToast();
  const lookups = useLookups();

  const [tab, setTab] = useState("builder");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const [meta, setMeta] = useState({
    courseId: "",
    subjectId: "",
    chapterId: "",
    title: "",
    titleMr: "",
    description: "",
    difficulty: "medium",
    timeLimitMin: 15,
    passingPercent: 40,
    isFree: true,
    published: false,
  });
  const [questions, setQuestions] = useState([emptyQuestion()]);

  useEffect(() => {
    if (isNew) return;
    adminService
      .get("quizzes", id)
      .then(({ item }) => {
        setMeta({
          courseId: item.courseId || "",
          subjectId: item.subjectId || "",
          chapterId: item.chapterId || "",
          title: item.title || "",
          titleMr: item.titleMr || "",
          description: item.description || "",
          difficulty: item.difficulty || "medium",
          timeLimitMin: item.timeLimitMin || 15,
          passingPercent: item.passingPercent || 40,
          isFree: !!item.isFree,
          published: !!item.published,
        });
        setQuestions(
          (item.questions || []).map((q) => ({
            key: `q${q.id}`,
            text: q.text || "",
            textMr: q.textMr || "",
            options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
            optionsMr: Array.isArray(q.optionsMr) ? q.optionsMr : ["", "", "", ""],
            correctIndex: q.correctIndex ?? 0,
            explanation: q.explanation || "",
            marks: q.marks ?? 1,
            negativeMarks: q.negativeMarks ?? 0,
          })) || [emptyQuestion()],
        );
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  useEffect(() => {
    if (isNew || tab !== "analytics") return;
    adminService
      .analytics()
      .then((d) => setAnalytics(d))
      .catch(() => {});
  }, [tab, isNew]);

  const setQ = (idx, patch) =>
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));

  const move = (idx, dir) =>
    setQuestions((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const totalMarks = useMemo(
    () => questions.reduce((s, q) => s + (Number(q.marks) || 0), 0),
    [questions],
  );

  const save = async () => {
    if (!meta.courseId) return toast.error("Select a course first");
    if (!meta.title.trim()) return toast.error("Enter a test title");
    const clean = questions.filter((q) => q.text.trim() && q.options.every((o) => String(o).trim()));
    if (!clean.length) return toast.error("Add at least one complete question");

    setSaving(true);
    try {
      const payload = {
        ...meta,
        courseId: Number(meta.courseId),
        subjectId: meta.subjectId ? Number(meta.subjectId) : null,
        chapterId: meta.chapterId ? Number(meta.chapterId) : null,
        timeLimitMin: Number(meta.timeLimitMin),
        passingPercent: Number(meta.passingPercent),
        questions: clean.map((q) => ({
          text: q.text,
          textMr: q.textMr,
          options: q.options,
          optionsMr: q.optionsMr,
          correctIndex: Number(q.correctIndex),
          explanation: q.explanation,
          marks: Number(q.marks),
          negativeMarks: Number(q.negativeMarks),
        })),
      };
      if (isNew) {
        const { item } = await adminService.create("quizzes", payload);
        toast.success(t("admin.created"));
        router.replace(`/admin/quizzes/${item.id}`);
      } else {
        await adminService.update("quizzes", id, payload);
        toast.success(t("admin.saved"));
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const subjectOptions = lookups.subjects
    .filter((s) => Number(s.courseId) === Number(meta.courseId))
    .map((s) => ({ value: s.id, label: s.name }));
  const chapterOptions = lookups.chapters
    .filter((c) => Number(c.courseId) === Number(meta.courseId))
    .map((c) => ({ value: c.id, label: c.title }));

  const stat = analytics?.quizStats?.find((s) => String(s.id) === String(id));

  return (
    <AdminShell
      title={isNew ? t("admin.newQuiz") : tf(meta, "title") || t("admin.quizzes")}
      subtitle={`${questions.length} ${t("tests.questions")} · ${totalMarks} ${t("tests.marks")}`}
      breadcrumbs={[
        { label: t("admin.dashboard"), href: "/admin" },
        { label: t("admin.quizzes"), href: "/admin/quizzes" },
        { label: isNew ? t("common.create") : t("common.edit") },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" leftIcon={Eye} onClick={() => setPreview(true)}>
            {t("common.preview")}
          </Button>
          <Button size="md" leftIcon={Save} loading={saving} onClick={save}>
            {t("common.save")}
          </Button>
        </div>
      }
    >
      <Tabs
        className="mb-4 max-w-md"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "builder", label: t("admin.questionBuilder") },
          { value: "settings", label: t("admin.settings") },
          ...(isNew ? [] : [{ value: "analytics", label: t("admin.analytics") }]),
        ]}
      />

      {tab === "settings" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 space-y-4">
            <SectionHeader title={t("admin.basicInfo")} icon={ClipboardList} />
            <Select
              label={t("admin.courses")}
              value={meta.courseId}
              onChange={(e) => setMeta({ ...meta, courseId: e.target.value, subjectId: "", chapterId: "" })}
              placeholder="Select course"
              options={lookups.courses.map((c) => ({ value: c.id, label: c.title }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label={t("admin.subjects")} value={meta.subjectId} onChange={(e) => setMeta({ ...meta, subjectId: e.target.value })} placeholder="—" options={subjectOptions} />
              <Select label={t("admin.chapters")} value={meta.chapterId} onChange={(e) => setMeta({ ...meta, chapterId: e.target.value })} placeholder="—" options={chapterOptions} />
            </div>
            <Input label={`${t("common.title")} (English)`} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
            <Input label={`${t("common.title")} (मराठी)`} value={meta.titleMr} onChange={(e) => setMeta({ ...meta, titleMr: e.target.value })} />
            <Textarea label={t("common.description")} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
          </Card>
          <div className="space-y-4">
            <Card className="space-y-4">
              <SectionHeader title={t("admin.access")} />
              <Select
                label={t("tests.difficulty")}
                value={meta.difficulty}
                onChange={(e) => setMeta({ ...meta, difficulty: e.target.value })}
                options={[
                  { value: "easy", label: t("tests.easy") },
                  { value: "medium", label: t("tests.medium") },
                  { value: "hard", label: t("tests.hard") },
                ]}
              />
              <Input label={`${t("tests.timeLimit")} (${t("common.minutes")})`} type="number" value={meta.timeLimitMin} onChange={(e) => setMeta({ ...meta, timeLimitMin: e.target.value })} />
              <Input label={`${t("tests.passing")} %`} type="number" value={meta.passingPercent} onChange={(e) => setMeta({ ...meta, passingPercent: e.target.value })} />
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <Switch checked={meta.isFree} onChange={(v) => setMeta({ ...meta, isFree: v })} label={t("common.free")} description="Free tests are open to all students" />
                <Switch checked={meta.published} onChange={(v) => setMeta({ ...meta, published: v })} label={t("common.published")} />
              </div>
            </Card>
            <Alert tone="info" title="Scoring is server-side">
              Correct answers, marks and pass/fail are evaluated on the backend. The paper API never
              returns the answer key.
            </Alert>
          </div>
        </div>
      ) : null}

      {tab === "builder" ? (
        <div className="space-y-3.5">
          {questions.map((q, idx) => (
            <Card key={q.key} className="space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-[13px] font-bold text-white">
                  {idx + 1}
                </span>
                <Badge tone="outline">{q.marks} {t("tests.marks")}</Badge>
                {Number(q.negativeMarks) > 0 ? <Badge tone="danger">-{q.negativeMarks}</Badge> : null}
                <div className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => move(idx, -1)} title="Move up">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => move(idx, 1)} title="Move down">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-accent-600 hover:bg-accent-50"
                    onClick={() => setQuestions((p) => (p.length > 1 ? p.filter((_, i) => i !== idx) : p))}
                    title={t("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                  {t("quiz.question")}
                </p>
                {/* Two clearly separate language columns — each labeled only
                    "English" / "मराठी" (never both sharing the same leading
                    word) so it's unambiguous which box takes which language,
                    regardless of the admin's own interface language. */}
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <Textarea rows={3} label="English" value={q.text} onChange={(e) => setQ(idx, { text: e.target.value })} placeholder="Which Article deals with…" />
                  <Textarea rows={3} label="मराठी" value={q.textMr} onChange={(e) => setQ(idx, { textMr: e.target.value })} placeholder="…याबाबत कोणते कलम आहे?" />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                  {t("quiz.options")}
                </p>
                <div className="space-y-2.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setQ(idx, { correctIndex: oi })}
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold transition ${
                          Number(q.correctIndex) === oi
                            ? "bg-teal-500 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                        title={t("admin.correctAnswer")}
                      >
                        {Number(q.correctIndex) === oi ? <CheckCircle2 className="h-4 w-4" /> : String.fromCharCode(65 + oi)}
                      </button>
                      <div className="grid flex-1 gap-1.5 sm:grid-cols-2">
                        <input
                          value={opt}
                          onChange={(e) =>
                            setQ(idx, { options: q.options.map((o, i) => (i === oi ? e.target.value : o)) })
                          }
                          placeholder={`Option ${String.fromCharCode(65 + oi)} — English`}
                          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[14px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                        />
                        <input
                          value={q.optionsMr?.[oi] || ""}
                          onChange={(e) =>
                            setQ(idx, {
                              optionsMr: (q.optionsMr?.length === 4 ? q.optionsMr : ["", "", "", ""]).map((o, i) =>
                                i === oi ? e.target.value : o,
                              ),
                            })
                          }
                          placeholder={`Option ${String.fromCharCode(65 + oi)} — मराठी`}
                          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[14px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Textarea rows={2} label={t("admin.explanation")} value={q.explanation} onChange={(e) => setQ(idx, { explanation: e.target.value })} placeholder="Why is this the correct answer?" />

              <div className="grid gap-3 sm:grid-cols-2">
                <Input label={t("admin.marks")} type="number" value={q.marks} onChange={(e) => setQ(idx, { marks: e.target.value })} />
                <Input label={t("admin.negativeMarks")} type="number" value={q.negativeMarks} onChange={(e) => setQ(idx, { negativeMarks: e.target.value })} />
              </div>
            </Card>
          ))}

          <Button variant="secondary" fullWidth leftIcon={Plus} onClick={() => setQuestions((p) => [...p, emptyQuestion()])}>
            {t("admin.addQuestion")}
          </Button>
        </div>
      ) : null}

      {tab === "analytics" ? (
        <div className="space-y-4">
          {!analytics ? (
            <PageLoader />
          ) : (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <StatTile icon={BarChart3} label={t("admin.attempts")} value={stat?.attempts ?? 0} />
                <StatTile icon={Target} label={t("admin.avgScore")} value={`${stat?.avgScore ?? 0}%`} tone="teal" />
                <StatTile icon={TrendingDown} label={t("admin.highest")} value={`${stat?.highest ?? 0}%`} tone="amber" />
                <StatTile icon={TrendingDown} label={t("admin.lowest")} value={`${stat?.lowest ?? 0}%`} tone="accent" />
                <StatTile icon={CheckCircle2} label={t("admin.passRate")} value={`${stat?.passRate ?? 0}%`} tone="teal" />
                <StatTile icon={Clock} label={t("admin.avgTime")} value={formatSeconds(stat?.avgTimeSec ?? 0)} tone="slate" />
              </div>
              <Card>
                <SectionHeader title={t("admin.hardestQuestions")} subtitle="Ranked by share of incorrect answers" />
                {analytics.hardest?.length ? (
                  <ul className="divide-y divide-slate-50">
                    {analytics.hardest.map((h, i) => (
                      <li key={i} className="flex items-start gap-3 py-2.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-50 text-[11px] font-bold text-accent-600">
                          {i + 1}
                        </span>
                        <p className="min-w-0 flex-1 text-[13px] text-ink">{h.text}</p>
                        <Badge tone="danger">{h.errorRate}% wrong</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-[13px] text-muted">{t("common.noResults")}</p>
                )}
              </Card>
            </>
          )}
        </div>
      ) : null}

      {/* Student-eye preview */}
      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        title={t("common.preview")}
        description="Exactly what a student sees while attempting"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-brand-600 px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold">{meta.title || "Untitled test"}</p>
              <p className="text-[11px] text-white/70">
                {questions.length} {t("tests.questions")} · {totalMarks} {t("tests.marks")}
              </p>
            </div>
            <span className="rounded-lg bg-white/15 px-2.5 py-1.5 text-[13px] font-bold tabular-nums">
              {String(meta.timeLimitMin).padStart(2, "0")}:00
            </span>
          </div>
          {questions.map((q, i) => (
            <div key={q.key} className="rounded-xl border border-slate-200 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                {t("quiz.question")} {i + 1}
              </p>
              <p className="mt-1.5 text-[14px] font-semibold leading-relaxed text-ink">
                {q.text || "Question text will appear here"}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((o, oi) => (
                  <div
                    key={oi}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-[13.5px] ${
                      Number(q.correctIndex) === oi
                        ? "border-teal-300 bg-teal-50 text-teal-800"
                        : "border-slate-200"
                    }`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[11px] font-bold">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {o || `Option ${String.fromCharCode(65 + oi)}`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </AdminShell>
  );
}
