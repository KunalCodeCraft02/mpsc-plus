"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Languages,
  Bell,
  FileText,
  Trash2,
  LogOut,
  Info,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { authService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Card,
  SectionHeader,
  Select,
  Switch,
  Button,
  Input,
  Badge,
  ConfirmDialog,
  Alert,
} from "@/components/ui";
import { LANGUAGES, APP_VERSION, POLICY } from "@/lib/config";
import { LEGAL_DOCS } from "@/lib/legal";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { user, logout, updateUser } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [push, setPush] = useState(true);
  const [emails, setEmails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { user: updated } = await authService.updateProfile({ name, language: lang });
      updateUser(updated);
      toast.success(t("settings.saved"));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const changeLanguage = async (code) => {
    setLang(code);
    try {
      const { user: updated } = await authService.updateProfile({ language: code });
      updateUser(updated);
      toast.success(t("language.saved"));
    } catch {
      /* language still applies locally */
    }
  };

  return (
    <StudentShell title={t("settings.title")}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeader title={t("settings.account")} icon={User} />
          <div className="space-y-3.5">
            <Input label={t("auth.fullName")} value={name} onChange={(e) => setName(e.target.value)} />
            <Input label={t("auth.email")} value={user?.email || ""} disabled />
            <Input label={t("auth.mobile")} value={user?.mobile || ""} disabled />
            <Button size="sm" loading={saving} onClick={saveProfile}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </Card>

        <Card>
          <SectionHeader title={t("settings.preferences")} icon={Languages} />
          <Select
            label={t("settings.appLanguage")}
            value={lang}
            onChange={(e) => changeLanguage(e.target.value)}
            options={LANGUAGES.map((l) => ({ value: l.code, label: l.native }))}
          />
          <div className="mt-4 space-y-3.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-muted">
              <Bell className="h-3.5 w-3.5" />
              {t("settings.notifications")}
            </p>
            <Switch checked={push} onChange={setPush} label={t("settings.pushNotifications")} description="New lectures, tests and announcements" />
            <Switch checked={emails} onChange={setEmails} label={t("settings.emailUpdates")} description="Weekly summary of your progress" />
          </div>
        </Card>

        <Card>
          <SectionHeader title={t("settings.legalSection")} icon={FileText} />
          <div className="divide-y divide-slate-50">
            {["terms", "privacy", "refund", "copyright"].map((k) => (
              <Link
                key={k}
                href={LEGAL_DOCS[k].href}
                className="flex items-center gap-3 py-3 transition hover:text-brand-700"
              >
                <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-ink">{t(`legal.${k}`)}</span>
                <Badge tone="outline">v{LEGAL_DOCS[k].version}</Badge>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>
          <Alert tone="info" className="mt-3.5">
            You accepted Terms v{user?.termsVersion || "—"} and Privacy v{user?.privacyVersion || "—"}.
            Current versions: v{POLICY.termsVersion} / v{POLICY.privacyVersion}.
          </Alert>
        </Card>

        <Card>
          <SectionHeader title={t("settings.about")} icon={Info} />
          <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted">{t("app.name")}</span>
              <span className="font-semibold">{t("app.tagline")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("settings.version")}</span>
              <span className="font-semibold">{APP_VERSION}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Role</span>
              <span className="font-semibold">{user?.role}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={LogOut}
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              {t("common.logout")}
            </Button>
            {user?.role === "ADMIN" ? (
              <Button as={Link} href="/admin" size="sm" leftIcon={ShieldCheck}>
                {t("admin.panel")}
              </Button>
            ) : null}
          </div>
        </Card>

        <Card className="border-red-200 bg-red-50/40 lg:col-span-2">
          <SectionHeader title={t("settings.dangerZone")} icon={Trash2} />
          <p className="text-[13px] leading-relaxed text-muted">{t("settings.deleteAccountBody")}</p>
          <Button variant="danger" size="sm" className="mt-3.5" leftIcon={Trash2} onClick={() => setConfirmDelete(true)}>
            {t("settings.deleteAccount")}
          </Button>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          toast.info("Account deletion requires confirmation from support in this build.");
        }}
        title={t("settings.deleteAccount")}
        body={t("settings.deleteAccountBody")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
      />
    </StudentShell>
  );
}
