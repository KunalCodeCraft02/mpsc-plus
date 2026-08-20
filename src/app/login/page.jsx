"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthShell } from "@/components/layout/AuthShell";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useQuery } from "@/hooks/useQuery";
import { Button, Input, PasswordInput, Alert } from "@/components/ui";
import { loginSchema } from "@/server/validation";
import { firebaseErrorMessage } from "@/lib/firebaseErrors";

export default function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useQuery();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const user = await login(values);
      toast.success(`${t("auth.loginTitle")}, ${user.name.split(" ")[0]}!`);
      const next = params.next;
      router.replace(next || (user.role === "ADMIN" ? "/admin" : "/home"));
    } catch (e) {
      setServerError(e.code ? firebaseErrorMessage(e) : e.message);
    }
  };

  return (
    <AuthShell>
      <div>
        <h1 className="text-ink">{t("auth.loginTitle")}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{t("auth.loginSub")}</p>

        {serverError ? (
          <Alert tone="danger" className="mt-6" role="alert">
            {serverError}
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
          <Input
            label={t("auth.identifier")}
            placeholder={t("auth.identifierPlaceholder")}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            error={errors.identifier?.message}
            {...register("identifier")}
          />

          <div>
            <PasswordInput
              label={t("auth.password")}
              placeholder={t("auth.passwordPlaceholder")}
              autoComplete="current-password"
              showLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="mt-2 flex justify-end">
              <Link
                href="/forgot-password"
                className="rounded-xs text-[13px] font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                {t("auth.forgot")}
              </Link>
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
            {isSubmitting ? t("auth.loggingIn") : t("welcome.login")}
          </Button>
        </form>

        <p className="mt-8 border-t border-slate-200 pt-6 text-center text-[14px] text-muted">
          {t("auth.noAccount")}{" "}
          <Link
            href="/language"
            className="rounded-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            {t("auth.createAccount")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
