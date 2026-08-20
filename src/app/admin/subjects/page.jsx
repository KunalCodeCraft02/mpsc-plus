"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { subjectsConfig } from "@/components/admin/resourceConfigs";
import { useI18n } from "@/context/I18nContext";

export default function AdminSubjectsPage() {
  const { t, tf } = useI18n();
  return (
    <AdminShell
      title={t("admin.subjects")}
      subtitle="Organise each course into syllabus-mapped subjects"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.subjects") }]}
    >
      <ResourceManager entity="subjects" config={subjectsConfig(t, tf)} />
    </AdminShell>
  );
}
