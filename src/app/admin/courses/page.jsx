"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { coursesConfig } from "@/components/admin/resourceConfigs";
import { useI18n } from "@/context/I18nContext";

export default function AdminCoursesPage() {
  const { t, tf } = useI18n();
  return (
    <AdminShell
      title={t("admin.courses")}
      subtitle="Create, price, publish and manage every course on MPSC Pulse"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.courses") }]}
    >
      <ResourceManager entity="courses" config={coursesConfig(t, tf)} />
    </AdminShell>
  );
}
