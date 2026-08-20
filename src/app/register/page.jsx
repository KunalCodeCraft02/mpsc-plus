"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, ArrowRight, ArrowLeft, Check, Mail, Phone, User } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { useI18n } from "@/context/I18nContext";
import { useAuth, markOnboarded } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button, Input, PasswordInput, Select, Checkbox, Alert, ProgressBar } from "@/components/ui";
import { registerSchema } from "@/server/validation";
import { POLICY, LANGUAGES } from "@/lib/config";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "stepBasics", fields: ["name", "mobile", "email"] },
  { key: "stepSecurity", fields: ["password", "confirmPassword"] },
  { key: "stepPrefs", fields: ["language", "acceptedTerms"] },
];

export default function RegisterPage() {
  const { t, lang, setLang } = useI18n();
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState(null);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      password: "",
      confirmPassword: "",
      language: lang,
      acceptedTerms: false,
      termsVersion: POLICY.termsVersion,
      privacyVersion: POLICY.privacyVersion,
      platform: "web",
    },
  });

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const next = async () => {
    const valid = await trigger(STEPS[step].fields);
    if (!valid) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const user = await registerUser(values);
      setLang(values.language);
      markOnboarded();
      toast.success(`${t("app.name")} — ${user.name.split(" ")[0]}, welcome aboard!`);
      router.replace("/home");
    } catch (e) {
      setServerError(e.message);
      if (e.data?.field === "email") setStep(0);
      if (e.data?.field === "mobile") setStep(0);
    }
  };

  const agreed = watch("acceptedTerms");

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <UserPlus className="h-5.5 w-5.5" style={{ height: 22, width: 22 }} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">{t("auth.registerTitle")}</h1>
        <p className="mt-1.5 text-[14px] text-muted">{t("auth.registerSub")}</p>

        {/* Stepper */}
        <div className="mt-6">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold transition",
                    i < step
                      ? "bg-teal-500 text-white"
                      : i === step
                        ? "bg-brand-600 text-white"
                        : "bg-slate-200 text-slate-500",
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                {i < STEPS.length - 1 ? (
                  <span className={cn("h-1 flex-1 rounded-full", i < step ? "bg-teal-500" : "bg-slate-200")} />
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[12.5px] font-semibold text-brand-700">
            {t("auth.step")} {step + 1}/{STEPS.length} · {t(`auth.${STEPS[step].key}`)}
          </p>
          <ProgressBar value={((step + 1) / STEPS.length) * 100} size="sm" className="mt-2" />
        </div>

        {serverError ? (
          <Alert tone="danger" className="mt-5">
            {serverError}
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          {step === 0 ? (
            <>
              <Input
                label={t("auth.fullName")}
                placeholder="Aarav Patil"
                leftIcon={User}
                autoComplete="name"
                error={errors.name?.message}
                {...register("name")}
              />
              <Input
                label={t("auth.mobile")}
                placeholder="9876543210"
                inputMode="numeric"
                maxLength={10}
                leftIcon={Phone}
                autoComplete="tel"
                error={errors.mobile?.message}
                {...register("mobile")}
              />
              <Input
                label={t("auth.email")}
                placeholder="you@example.com"
                type="email"
                leftIcon={Mail}
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <PasswordInput
                label={t("auth.password")}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                hint="Use 8+ characters with at least one letter and one number."
                showLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
                error={errors.password?.message}
                {...register("password")}
              />
              <PasswordInput
                label={t("auth.confirmPassword")}
                placeholder="Re-enter password"
                autoComplete="new-password"
                showLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              <Alert tone="info">
                Passwords are hashed with bcrypt before they are stored. We can never read your
                password.
              </Alert>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Select
                label={t("auth.prefLanguage")}
                options={LANGUAGES.map((l) => ({ value: l.code, label: l.native }))}
                error={errors.language?.message}
                {...register("language")}
              />
              <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
                <Checkbox
                  checked={!!agreed}
                  onChange={(v) => setValue("acceptedTerms", v, { shouldValidate: true })}
                  label={
                    <span className="text-[13.5px] leading-relaxed">
                      {t("legal.agree")}{" "}
                      <Link href="/terms" className="font-bold text-brand-600 hover:underline">
                        ({t("legal.terms")}
                      </Link>
                      {" · "}
                      <Link href="/privacy" className="font-bold text-brand-600 hover:underline">
                        {t("legal.privacy")})
                      </Link>
                    </span>
                  }
                />
                {errors.acceptedTerms ? (
                  <p className="mt-2 text-xs font-medium text-accent-600">
                    {t("legal.acceptRequired")}
                  </p>
                ) : null}
              </div>
              <p className="text-[11.5px] text-muted">
                Accepting records Terms v{POLICY.termsVersion} and Privacy v{POLICY.privacyVersion}{" "}
                against your account.
              </p>
            </>
          ) : null}

          <div className="flex gap-2.5 pt-1">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                leftIcon={ArrowLeft}
                onClick={() => setStep((s) => s - 1)}
              >
                {t("common.back")}
              </Button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Button type="button" size="lg" fullWidth rightIcon={ArrowRight} onClick={next}>
                {t("common.next")}
              </Button>
            ) : (
              <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={!agreed}>
                {isSubmitting ? t("auth.creating") : t("auth.signup")}
              </Button>
            )}
          </div>
        </form>

        <p className="mt-5 text-center text-[13.5px] text-muted">
          {t("welcome.haveAccount")}{" "}
          <Link href="/login" className="font-bold text-brand-600 hover:underline">
            {t("welcome.login")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
