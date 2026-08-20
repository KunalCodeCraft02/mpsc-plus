"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { PageLoader, Button, EmptyState } from "@/components/ui";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, needsPolicyAcceptance } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (needsPolicyAcceptance) {
      router.replace(`/terms-consent?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, needsPolicyAcceptance, router, pathname]);

  if (loading) return <PageLoader />;
  if (!isAuthenticated || needsPolicyAcceptance) return <PageLoader />;
  return children;
}

export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading || !isAuthenticated) return <PageLoader />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] p-5">
        <EmptyState
          icon={ShieldAlert}
          title={t("admin.unauthorized")}
          description="Only administrators can open this area. Head back to your learning dashboard."
          action={
            <Button onClick={() => router.replace("/home")}>{t("nav.home")}</Button>
          }
        />
      </div>
    );
  }
  return children;
}
