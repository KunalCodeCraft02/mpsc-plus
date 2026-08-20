"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Mail, ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import { Button, Input, PasswordInput, Alert } from "@/components/ui";
import { forgotSchema, resetPasswordSchema } from "@/server/validation";
import { authService } from "@/services/api";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  // null until a code has been requested; then the reset form is shown.
  const [sentTo, setSentTo] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const requestForm = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });
  const resetForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", code: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const requestCode = async (values) => {
    setServerError(null);
    try {
      const res = await authService.forgotPassword(values);
      setSentTo(values.email);
      resetForm.reset({ email: values.email, code: "", password: "", confirmPassword: "" });
      setCooldown(res.resendAfterSec || 60);
    } catch (error) {
      setServerError(error.message);
    }
  };

  const resend = async () => {
    setServerError(null);
    try {
      const res = await authService.forgotPassword({ email: sentTo });
      setCooldown(res.resendAfterSec || 60);
      toast.success(t("auth.otpResent"));
    } catch (error) {
      setServerError(error.message);
    }
  };

  const submitReset = async (values) => {
    setServerError(null);
    try {
      await authService.resetPassword(values);
      toast.success(t("auth.resetDone"));
      router.replace("/login");
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {sentTo ? (
            <MailCheck className="h-5.5 w-5.5" style={{ height: 22, width: 22 }} />
          ) : (
            <KeyRound className="h-5.5 w-5.5" style={{ height: 22, width: 22 }} />
          )}
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">{t("auth.forgotTitle")}</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t("auth.forgotSub")}</p>

        {serverError ? (
          <Alert tone="danger" className="mt-6" role="alert">
            {serverError}
          </Alert>
        ) : null}

        {sentTo ? (
          <>
            <Alert tone="success" className="mt-6">
              {t("auth.forgotSent")}
            </Alert>
            <form
              onSubmit={resetForm.handleSubmit(submitReset)}
              className="mt-5 space-y-4"
              noValidate
            >
              <Input
                label={t("auth.otpLabel")}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                leftIcon={ShieldCheck}
                className="tracking-[0.4em] font-bold"
                hint={t("auth.otpHint")}
                error={resetForm.formState.errors.code?.message}
                {...resetForm.register("code")}
              />
              <PasswordInput
                label={t("auth.newPassword")}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                showLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
                error={resetForm.formState.errors.password?.message}
                {...resetForm.register("password")}
              />
              <PasswordInput
                label={t("auth.confirmPassword")}
                placeholder="Re-enter password"
                autoComplete="new-password"
                showLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
                error={resetForm.formState.errors.confirmPassword?.message}
                {...resetForm.register("confirmPassword")}
              />
              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={resetForm.formState.isSubmitting}
              >
                {t("auth.resetPassword")}
              </Button>
            </form>
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className="mt-4 text-[13.5px] font-bold text-brand-600 disabled:text-slate-400 hover:underline disabled:no-underline"
            >
              {cooldown > 0 ? `${t("auth.resendIn")} ${cooldown}s` : t("auth.resend")}
            </button>
          </>
        ) : (
          <form
            onSubmit={requestForm.handleSubmit(requestCode)}
            className="mt-6 space-y-4"
            noValidate
          >
            <Input
              label={t("auth.email")}
              placeholder="you@example.com"
              type="email"
              leftIcon={Mail}
              error={requestForm.formState.errors.email?.message}
              {...requestForm.register("email")}
            />
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={requestForm.formState.isSubmitting}
            >
              {t("auth.sendCode")}
            </Button>
          </form>
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
