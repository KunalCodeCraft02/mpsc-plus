"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { chaptersConfig } from "@/components/admin/resourceConfigs";
import { useI18n } from "@/context/I18nContext";

export default function AdminChaptersPage() {
  const { t, tf } = useI18n();
  return (
    <AdminShell
      title={t("admin.chapters")}
      subtitle="Break subjects into ordered chapters for lectures and notes"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.chapters") }]}
    >
      <ResourceManager entity="chapters" config={chaptersConfig(t, tf)} />
    </AdminShell>
  );
}
