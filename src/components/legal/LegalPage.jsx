"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { Badge, Alert } from "@/components/ui";
import { BrandLock } from "@/components/layout/Brand";
import { LEGAL_CONTENT, LEGAL_DOCS } from "@/lib/legal";
import { POLICY } from "@/lib/config";

const ORDER = ["terms", "privacy", "refund", "copyright"];

export function LegalPage({ docKey }) {
  const { t, lang } = useI18n();
  const doc = LEGAL_CONTENT[docKey]?.[lang] || LEGAL_CONTENT[docKey]?.en;
  const meta = LEGAL_DOCS[docKey];

  return (
    <div className="min-h-dvh bg-[#f6f7fb]">
      <header className="safe-top sticky top-0 z-30 border-b border-slate-200 bg-white/92 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => window.history.back()}
            className="-ml-1.5 rounded-xl p-2 text-ink transition hover:bg-slate-100"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link href="/" className="min-w-0 flex-1">
            <BrandLock size={30} showTagline={false} />
          </Link>
          <Badge tone="outline">v{meta?.version}</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <FileText className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-tight text-ink sm:text-3xl">
          {doc?.title}
        </h1>
        <p className="mt-1.5 text-[12.5px] text-muted">
          {t("legal.version")} {meta?.version} · {t("legal.updated")} {POLICY.updatedAt}
        </p>
        <p className="mt-5 text-[15px] leading-relaxed text-slate-700">{doc?.intro}</p>

        <div className="mt-8 space-y-7">
          {(doc?.sections || []).map((s) => (
            <section key={s.heading}>
              <h2 className="text-[17px] font-bold tracking-tight text-ink">{s.heading}</h2>
              <ul className="mt-2.5 space-y-2.5">
                {s.body.map((p, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <Alert tone="info" className="mt-10">
          These documents describe how the MPSC Pulse product works. They are written in plain
          language for students and are not a substitute for professional legal advice.
        </Alert>

        <nav className="mt-8 flex flex-wrap gap-2">
          {ORDER.filter((k) => k !== docKey).map((k) => (
            <Link
              key={k}
              href={LEGAL_DOCS[k].href}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              {t(`legal.${k}`)}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
