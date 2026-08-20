"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { studentsConfig } from "@/components/admin/resourceConfigs";
import { useI18n } from "@/context/I18nContext";
import { Alert } from "@/components/ui";

export default function AdminStudentsPage() {
  const { t, tf } = useI18n();
  return (
    <AdminShell
      title={t("admin.students")}
      subtitle="Progress, XP and account status for every learner"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.students") }]}
    >
      <ResourceManager
        entity="students"
        config={studentsConfig(t, tf)}
        renderExtra={() => (
          <Alert tone="info">
            Password hashes are never selected by the API, so they cannot appear in this table or in
            any network response.
          </Alert>
        )}
      />
    </AdminShell>
  );
}
