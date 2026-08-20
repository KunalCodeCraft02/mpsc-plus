"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { BrandLock, PulseMark } from "./Brand";
import { useI18n } from "@/context/I18nContext";

export function AuthShell({ children, side = true }) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <div className="flex min-h-dvh bg-[#f6f7fb]">
      {side ? (
        <aside className="relative hidden w-[46%] max-w-2xl flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-10 text-white lg:flex">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.07]" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent-500/15" />
          <Link href="/" className="relative flex items-center gap-3">
            <PulseMark size={44} />
            <div>
              <p className="text-xl font-bold tracking-tight">
                MPSC <span className="text-brand-200">Pulse</span>
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                {t("app.tagline")}
              </p>
            </div>
          </Link>

          <div className="relative">
            <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-balance">
              {t("app.pitch")}
            </h2>
            <ul className="mt-7 space-y-3.5">
              {["welcome.feature1", "welcome.feature2", "welcome.feature3"].map((k) => (
                <li key={k} className="flex items-center gap-3 text-[14.5px] text-white/85">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-teal-300" style={{ height: 18, width: 18 }} />
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-[12px] text-white/45">
            {t("welcome.trustedBy")} · मराठी + English
          </p>
        </aside>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-16 items-center gap-2 px-5 pb-4 pt-[calc(1rem+var(--sat))] lg:hidden">
          <button
            type="button"
            onClick={() => router.back()}
            className="-ml-2 rounded-xl p-2 text-ink transition hover:bg-slate-100"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link href="/" className="min-w-0">
            <BrandLock size={34} showTagline={false} />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-2 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
