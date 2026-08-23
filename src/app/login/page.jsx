"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthShell } from "@/components/layout/AuthShell";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useQuery } from "@/hooks/useQuery";
import { Button, Input, PasswordInput, Alert, PageLoader } from "@/components/ui";
import { loginSchema } from "@/server/validation";

export default function LoginPage() {
  const { t } = useI18n();
  const { login, isAuthenticated, isAdmin, loading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useQuery();
  const [serverError, setServerError] = useState(null);

  // A WebView can resume with the last route still on /login even though the
  // token in storage is still valid (e.g. the app was backgrounded right
  // after a successful login, before the redirect below committed). Bounce
  // an already-authenticated visitor away instead of showing the form again.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(params.next || (isAdmin ? "/admin" : "/home"));
    }
  }, [loading, isAuthenticated, isAdmin, router, params.next]);

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
      setServerError(e.message);
    }
  };

  // Auth state is still restoring, or a redirect to Home is about to fire —
  // never show the login form during that window.
  if (loading || isAuthenticated) {
    return (
      <AuthShell>
        <PageLoader />
      </AuthShell>
    );
  }

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
