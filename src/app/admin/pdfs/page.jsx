"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { pdfsConfig } from "@/components/admin/resourceConfigs";
import { useI18n } from "@/context/I18nContext";
import { Alert } from "@/components/ui";

export default function AdminPdfsPage() {
  const { t, tf } = useI18n();
  return (
    <AdminShell
      title={t("admin.pdfs")}
      subtitle="Attach notes to courses, subjects and chapters"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.pdfs") }]}
    >
      <ResourceManager
        entity="pdfs"
        config={pdfsConfig(t, tf)}
        renderExtra={() => (
          <Alert tone="warning" title="Storage abstraction">
            PDFs are referenced by URL through a storage-key abstraction, so an object store can be
            connected later without changing this form. Disabling download hides the button and the
            server stops returning a download URL — screenshot prevention is only a deterrent, never
            treat it as real DRM.
          </Alert>
        )}
      />
    </AdminShell>
  );
}
