"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  PlayCircle,
  FileText,
  ClipboardList,
  Users,
  Clock,
  Globe,
  ChevronDown,
  Lock,
  CheckCircle2,
  ArrowRight,
  Layers,
} from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { catalogService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import {
  Card,
  Badge,
  Button,
  ProgressBar,
  SectionHeader,
  Tabs,
  PageLoader,
  ErrorState,
  Alert,
  StatTile,
} from "@/components/ui";
import { LectureCard, PDFCard, QuizCard } from "@/components/cards/ContentCards";
import { formatDuration, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, tf } = useI18n();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("curriculum");
  const [open, setOpen] = useState({});
  const [busy, setBusy] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);

  const load = () => {
    setError(null);
    catalogService
      .course(id)
      .then((d) => {
        setData(d);
        const first = d.curriculum?.[0];
        if (first) setOpen({ [first.id]: true });
      })
      .catch((e) => setError(e.message));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [id]);

  const enroll = async () => {
    setBusy(true);
    try {
      await catalogService.enroll(Number(id));
      toast.success(t("course.enrolled"));
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const purchaseCourse = async () => {
    const currentCourse = data?.course;
    if (!currentCourse || paymentBusy) return;
    setPaymentBusy(true);
    try {
      const { keyId, orderId, amount, currency, alreadyPurchased } = await import("@/services/api").then(({ paymentService }) =>
        paymentService.createOrder({ courseId: Number(id) }),
      );

      if (alreadyPurchased) {
        toast.success("Course already purchased");
        load();
        return;
      }

      const scriptId = "razorpay-checkout-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
        });
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is unavailable in this browser");
      }

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "MPSC Pulse",
        description: currentCourse.title || "Course purchase",
        handler: async function (response) {
          try {
            await import("@/services/api").then(({ paymentService }) =>
              paymentService.verify({
                courseId: Number(id),
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: Number(currentCourse.price || 0),
              }),
            );
            toast.success("Course purchased successfully");
            load();
          } catch (e) {
            toast.error(e.message || "Payment verification failed");
          }
        },
        prefill: { name: "Student" },
        theme: { color: "#5b34e0" },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled. You can try again anytime.");
          },
        },
      });

      rzp.open();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPaymentBusy(false);
    }
  };

  if (error) {
    return (
      <StudentShell title={t("course.details")}>
        <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
      </StudentShell>
    );
  }
  if (!data) {
    return (
      <StudentShell title={t("course.details")}>
        <PageLoader />
      </StudentShell>
    );
  }

  const { course, curriculum, hasAccess, isPurchased, enrollment, progressPercent, nextLecture } = data;

  return (
    <StudentShell title={t("course.details")}>
      {/* Hero */}
      <Card padded={false} className="overflow-hidden">
        {/* 16:9 everywhere — course cards, listings, search and this hero all
            crop the same artwork identically. */}
        <div className="relative aspect-video w-full bg-brand-800">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={isPurchased ? "success" : course.isFree ? "teal" : "amber"}>
                {isPurchased ? t("common.purchased") : course.isFree ? t("common.free") : formatPrice(course.price, course.currency)}
              </Badge>
              {!course.isFree && !isPurchased ? <Badge tone="dark">{t("common.paid")}</Badge> : null}
              {course.category ? <Badge tone="dark">{course.category}</Badge> : null}
            </div>
            <h1 className="mt-2 text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
              {tf(course, "title")}
            </h1>
            <p className="mt-1 text-[12.5px] text-white/75">{course.instructor}</p>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile icon={PlayCircle} label={t("common.lectures")} value={course.lectureCount} />
            <StatTile icon={FileText} label={t("common.pdfs")} value={course.pdfCount} tone="accent" />
            <StatTile icon={ClipboardList} label={t("common.quizzes")} value={course.quizCount} tone="teal" />
            <StatTile icon={Users} label={t("common.students")} value={course.studentCount} tone="amber" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(course.totalDurationMin)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {course.language}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              {course.validityDays ? `${course.validityDays} ${t("course.days")}` : t("course.lifetime")}
            </span>
          </div>

          {enrollment ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[12.5px] font-semibold">
                <span className="text-muted">{t("learning.progress")}</span>
                <span className="text-brand-700">{progressPercent}%</span>
              </div>
              <ProgressBar value={progressPercent} className="mt-1.5" />
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2.5">
            {hasAccess ? (
              nextLecture ? (
                <Button
                  size="lg"
                  leftIcon={PlayCircle}
                  onClick={() => router.push(`/lectures/${nextLecture.id}`)}
                >
                  {progressPercent > 0 ? t("course.continueLearning") : t("course.startLearning")}
                </Button>
              ) : (
                <Button size="lg" disabled>
                  {t("tests.empty")}
                </Button>
              )
            ) : course.isFree ? (
              <Button size="lg" loading={busy} onClick={enroll} rightIcon={ArrowRight}>
                {t("course.enroll")}
              </Button>
            ) : (
              <Button size="lg" loading={paymentBusy} onClick={purchaseCourse} rightIcon={ArrowRight}>
                {paymentBusy ? "Preparing Secure Payment..." : `${t("course.buyFor")} ${formatPrice(course.price, course.currency)}`}
              </Button>
            )}
          </div>

          {!hasAccess && !course.isFree ? (
            <Alert tone="info" className="mt-3.5">
              Secure Razorpay checkout is enabled for this paid course. Your payment is verified on the server before course access is granted.
            </Alert>
          ) : null}
        </div>
      </Card>

      <Tabs
        className="mt-5"
        fill
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "curriculum", label: t("course.curriculum") },
          { value: "materials", label: t("nav.downloads"), count: data.pdfs.length },
          { value: "tests", label: t("nav.tests"), count: data.quizzes.length },
          { value: "about", label: t("course.about") },
        ]}
      />

      <div className="mt-4">
        {tab === "curriculum" ? (
          <div className="space-y-3">
            {curriculum.map((subject) => (
              <Card key={subject.id} padded={false} className="overflow-hidden">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [subject.id]: !o[subject.id] }))}
                  className="flex w-full items-center gap-3 p-3.5 text-left transition hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[13px] font-bold text-brand-700">
                    {subject.orderIndex}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-ink">{tf(subject, "name")}</span>
                    <span className="block text-[11.5px] text-muted">
                      {subject.chapters.length} {t("common.chapters")} ·{" "}
                      {subject.chapters.reduce((s, c) => s + c.lectures.length, 0)} {t("common.lectures")}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-slate-400 transition", open[subject.id] && "rotate-180")}
                  />
                </button>
                {open[subject.id] ? (
                  <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 p-3">
                    {subject.chapters.map((chapter) => (
                      <div key={chapter.id}>
                        <p className="mb-2 flex items-center gap-2 px-1 text-[12px] font-bold uppercase tracking-wide text-muted">
                          <Layers className="h-3.5 w-3.5" />
                          {tf(chapter, "title")}
                        </p>
                        <div className="space-y-2">
                          {chapter.lectures.map((l) => (
                            <LectureCard
                              key={l.id}
                              lecture={{ ...l, chapterTitle: tf(chapter, "title") }}
                              locked={l.locked}
                              completed={l.completed}
                              progress={l.progress}
                            />
                          ))}
                          {chapter.pdfs.map((p) => (
                            <PDFCard key={`pdf-${p.id}`} pdf={p} locked={p.locked} />
                          ))}
                          {!chapter.lectures.length && !chapter.pdfs.length ? (
                            <p className="px-1 py-2 text-[12px] text-muted">{t("common.noResults")}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Card>
            ))}
            {!curriculum.length ? (
              <Card>
                <p className="py-6 text-center text-[13px] text-muted">{t("common.noResults")}</p>
              </Card>
            ) : null}
          </div>
        ) : null}

        {tab === "materials" ? (
          <div className="space-y-2.5">
            {data.pdfs.length ? (
              data.pdfs.map((p) => <PDFCard key={p.id} pdf={p} locked={p.locked} />)
            ) : (
              <Card>
                <p className="py-6 text-center text-[13px] text-muted">{t("common.noResults")}</p>
              </Card>
            )}
          </div>
        ) : null}

        {tab === "tests" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.quizzes.length ? (
              data.quizzes.map((q) => <QuizCard key={q.id} quiz={q} locked={q.locked} />)
            ) : (
              <Card className="sm:col-span-2">
                <p className="py-6 text-center text-[13px] text-muted">{t("tests.emptySub")}</p>
              </Card>
            )}
          </div>
        ) : null}

        {tab === "about" ? (
          <Card>
            <SectionHeader title={t("course.about")} />
            <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-slate-700">
              {tf(course, "description") || "—"}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("course.instructor")}</p>
                <p className="mt-1 text-[14px] font-bold text-ink">{course.instructor || "—"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("course.validity")}</p>
                <p className="mt-1 text-[14px] font-bold text-ink">
                  {course.validityDays ? `${course.validityDays} ${t("course.days")}` : t("course.lifetime")}
                </p>
              </div>
            </div>
            {!hasAccess ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3.5 text-[13px] text-amber-900">
                <Lock className="h-4 w-4 shrink-0" />
                {t("course.locked")} — {t("course.freePreview")} {t("common.free").toLowerCase()}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-teal-50 p-3.5 text-[13px] text-teal-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t("course.enrolled")}
              </div>
            )}
            <Button as={Link} href="/courses" variant="outline" size="sm" className="mt-5">
              {t("home.exploreCourses")}
            </Button>
          </Card>
        ) : null}
      </div>
    </StudentShell>
  );
}
