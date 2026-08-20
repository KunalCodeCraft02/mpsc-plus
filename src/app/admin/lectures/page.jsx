"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { lecturesConfig } from "@/components/admin/resourceConfigs";
import { useI18n } from "@/context/I18nContext";
import { Alert } from "@/components/ui";

export default function AdminLecturesPage() {
  const { t, tf } = useI18n();
  return (
    <AdminShell
      title={t("admin.lectures")}
      subtitle="Add YouTube (unlisted) lectures, reorder them and control access"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.lectures") }]}
    >
      <ResourceManager
        entity="lectures"
        config={lecturesConfig(t, tf)}
        renderExtra={() => (
          <Alert tone="info" title="How video hosting works here">
            Upload your recording to YouTube as <strong>Unlisted</strong>, then paste the link below.
            Only the 11-character video ID is stored — no third-party video SDK is used.
          </Alert>
        )}
      />
    </AdminShell>
  );
}
