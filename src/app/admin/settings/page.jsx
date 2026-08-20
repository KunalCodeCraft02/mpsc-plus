"use client";

import Link from "next/link";
import { Zap, Trophy, ShieldCheck, Languages, FileText } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Card, SectionHeader, Badge, Alert, Select, Button } from "@/components/ui";
import { XP_RULES, LEVELS, POLICY, APP_VERSION, LANGUAGES } from "@/lib/config";

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
      </div>
    </AdminShell>
  );
}
