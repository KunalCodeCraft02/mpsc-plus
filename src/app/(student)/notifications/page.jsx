"use client";

import { useEffect, useState } from "react";
import { Bell, PlayCircle, ClipboardList, Megaphone, Info } from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { notificationService } from "@/services/api";
import { useI18n } from "@/context/I18nContext";
import { Card, Badge, SkeletonList, EmptyState, ErrorState, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";

const KIND = {
  lecture: { icon: PlayCircle, tone: "bg-brand-50 text-brand-600" },
  quiz: { icon: ClipboardList, tone: "bg-teal-50 text-teal-600" },
  announcement: { icon: Megaphone, tone: "bg-accent-50 text-accent-600" },
  update: { icon: Info, tone: "bg-amber-50 text-amber-600" },
};

export default function NotificationsPage() {
  const { t, tf } = useI18n();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [read, setRead] = useState({});

  const load = () => {
    setError(null);
    notificationService
      .list()
      .then((d) => setItems(d.items || []))
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  return (
    <StudentShell title={t("notifications.title")}>
      {items?.length ? (
        <div className="mb-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRead(Object.fromEntries(items.map((i) => [i.id, true])))}
          >
            {t("notifications.markAllRead")}
          </Button>
        </div>
      ) : null}

      {error ? (
        <ErrorState title={t("common.somethingWrong")} description={error} onRetry={load} retryLabel={t("common.retry")} />
      ) : !items ? (
        <SkeletonList rows={5} />
      ) : items.length ? (
        <div className="space-y-2.5">
          {items.map((n) => {
            const meta = KIND[n.kind] || KIND.update;
            const Icon = meta.icon;
            const isRead = read[n.id];
            return (
              <Card
                key={n.id}
                className={isRead ? "opacity-70" : "border-brand-100"}
                onClick={() => setRead((r) => ({ ...r, [n.id]: true }))}
              >
                <div className="flex gap-3.5">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-bold leading-snug text-ink">{tf(n, "title")}</p>
                      {!isRead ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-500" /> : null}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{tf(n, "body")}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone="outline" size="sm">
                        {n.kind}
                      </Badge>
                      <span className="text-[11px] text-muted">{formatDate(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Bell} title={t("notifications.empty")} description={t("notifications.emptySub")} />
      )}
    </StudentShell>
  );
}
