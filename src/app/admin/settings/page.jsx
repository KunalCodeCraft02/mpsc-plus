"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Zap, Trophy, ShieldCheck, Languages, FileText, Smartphone } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Card, SectionHeader, Badge, Alert, Select, Button, Input, Textarea } from "@/components/ui";
import { XP_RULES, LEVELS, POLICY, APP_VERSION, LANGUAGES } from "@/lib/config";
import { adminService } from "@/services/api";

function AppUpdateCard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minRequiredVersionCode, setMinRequiredVersionCode] = useState(1);
  const [latestVersionCode, setLatestVersionCode] = useState(1);
  const [latestVersionName, setLatestVersionName] = useState("1.0.0");
  const [notesText, setNotesText] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    adminService
      .getAppUpdatePolicy()
      .then((policy) => {
        setMinRequiredVersionCode(policy.minRequiredVersionCode);
        setLatestVersionCode(policy.latestVersionCode);
        setLatestVersionName(policy.latestVersionName);
        setNotesText((policy.releaseNotes || []).join("\n"));
        setUpdatedAt(policy.updatedAt);
      })
      .catch(() => toast.error("Could not load the Android update policy."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const policy = await adminService.saveAppUpdatePolicy({
        minRequiredVersionCode: Number(minRequiredVersionCode),
        latestVersionCode: Number(latestVersionCode),
        latestVersionName,
        releaseNotes: notesText.split("\n").map((n) => n.trim()).filter(Boolean),
      });
      setUpdatedAt(policy.updatedAt);
      toast.success("Update policy saved. Android devices were notified.");
    } catch (e) {
      toast.error(e.message || "Could not save the update policy.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <SectionHeader
        title="Android app update"
        subtitle="Devices below the minimum version are blocked until they update via Google Play"
        icon={Smartphone}
      />
      {loading ? (
        <p className="text-[13px] text-muted">Loading…</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latest versionCode"
              type="number"
              min={1}
              value={latestVersionCode}
              onChange={(e) => setLatestVersionCode(e.target.value)}
            />
            <Input
              label="Latest versionName"
              placeholder="1.2.0"
              value={latestVersionName}
              onChange={(e) => setLatestVersionName(e.target.value)}
            />
          </div>
          <Input
            label="Minimum required versionCode"
            type="number"
            min={1}
            hint="Devices with an installed versionCode below this are shown the mandatory update page. Set equal to the latest versionCode to force everyone; leave lower to make this release optional."
            value={minRequiredVersionCode}
            onChange={(e) => setMinRequiredVersionCode(e.target.value)}
          />
          <Textarea
            label="What's new (one line per bullet)"
            rows={4}
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
          />
          {updatedAt ? (
            <p className="text-[12px] text-muted">Last published: {new Date(updatedAt).toLocaleString()}</p>
          ) : null}
          <Button onClick={save} loading={saving} disabled={saving} fullWidth>
            Save &amp; notify Android devices
          </Button>
          <Alert tone="info">
            Saving broadcasts an FCM notification and updates what every device checks against
            Google Play on next launch/foreground. This does not itself publish anything to the
            Play Store — upload and roll out the signed AAB there first, then set the matching
            versionCode here.
          </Alert>
        </div>
      )}
    </Card>
  );
}

export default function AdminSettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();

  return (
    <AdminShell
      title={t("admin.settings")}
      subtitle="Gamification rules, policy versions and platform metadata"
      breadcrumbs={[{ label: t("admin.dashboard"), href: "/admin" }, { label: t("admin.settings") }]}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionHeader title="XP rules" subtitle="Awarded by the backend only — never by the client" icon={Zap} />
          <div className="divide-y divide-slate-50">
            {Object.entries(XP_RULES).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2.5">
                <span className="text-[13px] capitalize text-ink">{k.replace(/_/g, " ")}</span>
                <Badge tone="brand">+{v} XP</Badge>
              </div>
            ))}
          </div>
          <Alert tone="info" className="mt-4">
            XP events are de-duplicated by a unique <code>(user, kind, reference)</code> index, so a
            replayed request cannot grant XP twice.
          </Alert>
        </Card>

        <Card>
          <SectionHeader title="Level thresholds" subtitle="Configurable progression bands" icon={Trophy} />
          <div className="divide-y divide-slate-50">
            {LEVELS.map((l, i) => (
              <div key={l.key} className="flex items-center justify-between py-2.5">
                <span className="text-[13px] font-semibold text-ink">
                  L{i + 1} · {t(`gamify.levels.${l.key}`)}
                </span>
                <span className="text-[12.5px] tabular-nums text-muted">
                  {l.min}–{Number.isFinite(l.max) ? l.max : "∞"} XP
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Legal & policy versions" subtitle="Students must re-accept when a version changes" icon={ShieldCheck} />
          <div className="divide-y divide-slate-50">
            {[
              ["Terms & Conditions", POLICY.termsVersion, "/terms"],
              ["Privacy Policy", POLICY.privacyVersion, "/privacy"],
              ["Refund Policy", POLICY.refundVersion, "/refund-policy"],
              ["Copyright & Content Policy", POLICY.copyrightVersion, "/copyright-policy"],
            ].map(([label, version, href]) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <Link href={href} className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink hover:text-brand-700">
                  <FileText className="h-3.5 w-3.5 text-brand-600" />
                  {label}
                </Link>
                <Badge tone="outline">v{version}</Badge>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-muted">
            {t("legal.updated")}: {POLICY.updatedAt}
          </p>
        </Card>

        <Card>
          <SectionHeader title={t("admin.settings")} subtitle="Panel preferences" icon={Languages} />
          <Select
            label={t("settings.appLanguage")}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            options={LANGUAGES.map((l) => ({ value: l.code, label: l.native }))}
          />
          <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3.5 text-[12.5px]">
            <div className="flex justify-between"><span className="text-muted">Signed in as</span><span className="font-semibold">{user?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted">Role</span><span className="font-semibold">{user?.role}</span></div>
            <div className="flex justify-between"><span className="text-muted">{t("settings.version")}</span><span className="font-semibold">{APP_VERSION}</span></div>
          </div>
          <Button as={Link} href="/admin/audit" variant="outline" size="sm" fullWidth className="mt-4">
            {t("admin.auditLog")}
          </Button>
        </Card>

        <AppUpdateCard />
      </div>
    </AdminShell>
  );
}
