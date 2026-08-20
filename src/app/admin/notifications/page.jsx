"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { notificationsConfig } from "@/components/admin/resourceConfigs";
import { useI18n } from "@/context/I18nContext";

export default function AdminNotificationsPage() {
  const { t, tf } = useI18n();
  return (
    <AdminShell
      title={t("admin.notifications")}
      subtitle="Broadcast lecture drops, tests and announcements"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.notifications") }]}
    >
      <ResourceManager entity="notifications" config={notificationsConfig(t, tf)} />
    </AdminShell>
  );
}
