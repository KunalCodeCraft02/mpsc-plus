"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Mail, ArrowLeft, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { useI18n } from "@/context/I18nContext";
import { Button, Input, Alert } from "@/components/ui";
import { forgotSchema } from "@/server/validation";
import { firebaseAuth, isFirebaseConfigured, sendPasswordResetEmail } from "@/lib/firebase";
import { firebaseErrorMessage } from "@/lib/firebaseErrors";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      if (!isFirebaseConfigured) throw new Error("Firebase authentication is not configured");
      await sendPasswordResetEmail(firebaseAuth(), values.email);
      setSent(true);
    } catch (error) {
      setSent(false);
      setServerError(firebaseErrorMessage(error));
    }
  };

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {sent ? (
            <MailCheck className="h-5.5 w-5.5" style={{ height: 22, width: 22 }} />
          ) : (
            <KeyRound className="h-5.5 w-5.5" style={{ height: 22, width: 22 }} />
          )}
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">{t("auth.forgotTitle")}</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t("auth.forgotSub")}</p>

        {sent ? (
          <Alert tone="success" className="mt-6">
            {t("auth.forgotSent")}
          </Alert>
        ) : (
          <>
            {serverError ? <Alert tone="danger" className="mt-6">{serverError}</Alert> : null}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <Input
              label={t("auth.email")}
              placeholder="you@example.com"
              type="email"
              leftIcon={Mail}
              error={errors.email?.message}
              {...register("email")}
            />
            <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
              {t("auth.sendLink")}
            </Button>
            </form>
          </>
        )}

        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.backToLogin")}
        </Link>
      </div>
    </AuthShell>
  );
}
