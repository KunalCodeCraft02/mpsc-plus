"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Languages } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import { useQuery } from "@/hooks/useQuery";
import { Button } from "@/components/ui";
import { LANGUAGES } from "@/lib/config";
import { cn } from "@/lib/utils";

export default function LanguagePage() {
  const { t, lang, setLang } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const params = useQuery();
  const [choice, setChoice] = useState(lang);

  const next = params.next;
  const mode = params.mode;

  const proceed = () => {
    setLang(choice);
    toast.success(t("language.saved"));
    const target = mode === "login" ? "/login" : "/terms-consent";
    router.push(next ? `${target}?next=${encodeURIComponent(next)}` : target);
  };

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Languages className="h-5.5 w-5.5" style={{ height: 22, width: 22 }} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">
          {t("language.heading")}
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">{t("language.sub")}</p>

        <div className="mt-7 space-y-3">
          {LANGUAGES.map((l) => {
            const active = choice === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setChoice(l.code)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left transition",
                  active
                    ? "border-brand-600 shadow-soft"
                    : "border-slate-200 hover:border-brand-300",
                )}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold",
                    active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {l.code === "mr" ? "मरा" : "EN"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-bold text-ink">{l.native}</span>
                  <span className="block text-[12.5px] text-muted">
                    {l.code === "mr" ? "Marathi interface" : "English interface"}
                  </span>
                </span>
                {active ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Button size="lg" fullWidth className="mt-7" rightIcon={ArrowRight} onClick={proceed}>
          {t("common.continue")}
        </Button>
      </div>
    </AuthShell>
  );
}
