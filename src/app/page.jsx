"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  FileText,
  ClipboardCheck,
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PulseMark } from "@/components/layout/Brand";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Button, Badge } from "@/components/ui";

const FEATURES = [
  { icon: PlayCircle, key: "welcome.feature1", tone: "bg-brand-50 text-brand-600" },
  { icon: FileText, key: "welcome.feature2", tone: "bg-accent-50 text-accent-600" },
  { icon: ClipboardCheck, key: "welcome.feature3", tone: "bg-teal-50 text-teal-600" },
];

export default function WelcomePage() {
  const { t } = useI18n();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace(isAdmin ? "/admin" : "/home");
  }, [loading, isAuthenticated, isAdmin, router]);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-brand-800 via-brand-900 to-brand-950 text-white">
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-white/[0.06]" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-accent-500/15" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 pb-8 pt-10 safe-top safe-bottom lg:max-w-6xl lg:justify-center lg:pt-16">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            {/* Brand */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="relative">
                <span className="absolute inset-0 rounded-2xl bg-white/25 animate-pulse-ring" />
                <PulseMark size={72} tone="light" className="relative" />
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight lg:text-5xl">
                MPSC <span className="text-brand-200">Pulse</span>
              </h1>
              <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.28em] text-white/55">
                {t("app.tagline")}
              </p>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/75 text-balance lg:text-base">
                {t("app.pitch")}
              </p>
            </div>

            {/* CTAs */}
            <div className="mt-8 space-y-3 lg:max-w-sm">
              <Button
                as={Link}
                href="/language"
                size="lg"
                fullWidth
                rightIcon={ArrowRight}
                className="bg-white text-brand-800 hover:bg-white/90"
              >
                {t("welcome.getStarted")}
              </Button>
              <p className="text-center text-[13px] text-white/65 lg:text-left">
                {t("welcome.haveAccount")}{" "}
                <Link href="/login" className="font-bold text-white underline decoration-white/40 underline-offset-4">
                  {t("welcome.login")}
                </Link>
              </p>
            </div>
          </div>

          {/* Feature panel */}
          <div className="mt-12 lg:mt-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
              <Badge tone="dark" className="bg-white/15 text-white" icon={Sparkles}>
                {t("welcome.trustedBy")}
              </Badge>
              <div className="mt-4 space-y-3">
                {FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.key} className="flex items-center gap-3.5 rounded-2xl bg-white p-3.5 text-ink shadow-soft">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${f.tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="text-[14px] font-bold leading-snug">{t(f.key)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-3.5">
                  <Trophy className="h-4.5 w-4.5 text-amber-300" style={{ height: 18, width: 18 }} />
                  <p className="mt-2 text-[13px] font-bold">XP & Leaderboards</p>
                  <p className="text-[11px] text-white/60">Ranked on real learning</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3.5">
                  <Flame className="h-4.5 w-4.5 text-accent-300" style={{ height: 18, width: 18 }} />
                  <p className="mt-2 text-[13px] font-bold">Study streaks</p>
                  <p className="text-[11px] text-white/60">Stay consistent daily</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11.5px] text-white/50 lg:justify-start">
              <Link href="/terms" className="hover:text-white">{t("legal.terms")}</Link>
              <Link href="/privacy" className="hover:text-white">{t("legal.privacy")}</Link>
              <Link href="/refund-policy" className="hover:text-white">{t("legal.refund")}</Link>
              <Link href="/copyright-policy" className="hover:text-white">{t("legal.copyright")}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
