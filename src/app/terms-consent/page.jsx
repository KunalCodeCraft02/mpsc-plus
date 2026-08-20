"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, FileText, ArrowRight, ExternalLink } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { useI18n } from "@/context/I18nContext";
import { useAuth, markOnboarded } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useQuery } from "@/hooks/useQuery";
import { Button, Checkbox, Badge, Alert } from "@/components/ui";
import { POLICY } from "@/lib/config";
import { LEGAL_DOCS } from "@/lib/legal";

export default function TermsConsentPage() {
  const { t, lang } = useI18n();
  const { isAuthenticated, needsPolicyAcceptance, acceptPolicy } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useQuery();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const primary = ["terms", "privacy"];
  const secondary = ["refund", "copyright"];

  const proceed = async () => {
    if (!agreed) return toast.warning(t("legal.acceptRequired"));
    setBusy(true);
    try {
      if (isAuthenticated) {
        await acceptPolicy({
          termsVersion: POLICY.termsVersion,
          privacyVersion: POLICY.privacyVersion,
          language: lang,
          platform: "web",
        });
        markOnboarded();
        router.replace(params.next || "/home");
      } else {
        markOnboarded();
        router.push("/register");
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <ShieldCheck className="h-5.5 w-5.5" style={{ height: 22, width: 22 }} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">
          {t("legal.beforeContinue")}
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t("legal.intro")}</p>

        {isAuthenticated && needsPolicyAcceptance ? (
          <Alert tone="warning" title={t("legal.reAcceptTitle")} className="mt-5">
            {t("legal.reAcceptBody")}
          </Alert>
        ) : null}

        <div className="mt-6 space-y-2.5">
          {primary.map((key) => {
            const doc = LEGAL_DOCS[key];
            return (
              <Link
                key={key}
                href={doc.href}
                className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-soft"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-ink">{t(`legal.${key}`)}</span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <Badge tone="outline" size="sm">
                      {t("legal.version")} {doc.version}
                    </Badge>
                    <span className="text-[11.5px] text-muted">
                      {t("legal.updated")} {POLICY.updatedAt}
                    </span>
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-600" />
              </Link>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1">
          {secondary.map((key) => (
            <Link
              key={key}
              href={LEGAL_DOCS[key].href}
              className="text-[12.5px] font-semibold text-brand-600 hover:underline"
            >
              {t(`legal.${key}`)}
            </Link>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border-2 border-slate-200 bg-white p-4">
          <Checkbox
            checked={agreed}
            onChange={setAgreed}
            label={
              <span className="text-[14px] leading-relaxed">
                {t("legal.agree")}
              </span>
            }
          />
        </div>

        <Button
          size="lg"
          fullWidth
          className="mt-5"
          rightIcon={ArrowRight}
          disabled={!agreed}
          loading={busy}
          onClick={proceed}
        >
          {t("common.continue")}
        </Button>
        {!agreed ? (
          <p className="mt-2.5 text-center text-[12px] text-muted">{t("legal.acceptRequired")}</p>
        ) : null}
      </div>
    </AuthShell>
  );
}
