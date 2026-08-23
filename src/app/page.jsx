"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Flame,
  ArrowRight,
} from "lucide-react";
import { PulseMark } from "@/components/layout/Brand";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui";

export default function WelcomePage() {
  const { t } = useI18n();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace(isAdmin ? "/admin" : "/home");
  }, [loading, isAuthenticated, isAdmin, router]);

  // The session restore is still in flight, or a redirect to Home is about
  // to fire for an already-authenticated user — never render the "Get
  // Started" onboarding screen during that window. Otherwise a returning,
  // already-logged-in user briefly sees onboarding on every cold start
  // before being bounced to Home, and can mistake that flash for having
  // been logged out.
  const checkingSession = loading || isAuthenticated;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-brand-800 via-brand-900 to-brand-950 text-white">
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-white/[0.06]" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-accent-500/15" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 pb-8 pt-[calc(2.5rem+var(--sat))] safe-bottom lg:max-w-2xl lg:pt-16">
        <div className="mx-auto w-full">
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
              {checkingSession ? (
                <p className="mt-5 flex items-center gap-2.5 text-[13px] font-semibold tracking-wide text-white/70">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Checking your session...
                </p>
              ) : (
                <>
                  <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.28em] text-white/55">
                    {t("app.tagline")}
                  </p>
                  <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/75 text-balance lg:text-base">
                    {t("app.pitch")}
                  </p>
                </>
              )}
            </div>

            {/* CTAs — hidden while the session restore is still deciding
                whether this is actually a returning, logged-in user. */}
            {!checkingSession ? (
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
            ) : null}
          </div>

          {!checkingSession ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11.5px] text-white/50">
              <Link href="/terms" className="hover:text-white">{t("legal.terms")}</Link>
              <Link href="/privacy" className="hover:text-white">{t("legal.privacy")}</Link>
              <Link href="/refund-policy" className="hover:text-white">{t("legal.refund")}</Link>
              <Link href="/copyright-policy" className="hover:text-white">{t("legal.copyright")}</Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
