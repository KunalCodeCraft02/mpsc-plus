"use client";

import { useEffect, useState } from "react";
import { ImageIcon, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Input } from "@/components/ui";

/** Course cards, listings and the course hero all render 16:9. */
const TARGET_RATIO = 16 / 9;
/** ±4% tolerance — 1280×720, 1600×900 and 1920×1080 all pass. */
const TOLERANCE = 0.04;

/**
 * Thumbnail picker for the admin course form.
 *
 * Shows the artwork at exactly the ratio students will see it at, and measures
 * the real image once loaded so the admin is warned about a wrong crop before
 * publishing rather than after.
 */
export function ThumbnailField({ label, value, error, register, name, t }) {
  // The probe records which URL it measured, so status for any *other* URL is
  // derived at render time rather than written from inside the effect.
  const [probe, setProbe] = useState({ url: "", status: "idle", dims: null });

  const url = (value || "").trim();

  useEffect(() => {
    if (!url) return undefined;

    // Debounce so we don't load an image on every keystroke while typing.
    const id = setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const off = Math.abs(w / h - TARGET_RATIO) / TARGET_RATIO;
        setProbe({ url, status: off <= TOLERANCE ? "ok" : "warn", dims: { w, h } });
      };
      img.onerror = () => setProbe({ url, status: "error", dims: null });
      img.src = url;
    }, 500);

    return () => clearTimeout(id);
  }, [url]);

  const measured = probe.url === url;
  const status = !url ? "idle" : measured ? probe.status : "loading";
  const dims = measured ? probe.dims : null;

  return (
    <div className="space-y-3">
      <Input
        label={label}
        placeholder="https://example.com/course-cover.jpg"
        error={error}
        inputMode="url"
        spellCheck={false}
        {...register(name)}
      />

      <p className="text-[12.5px] leading-relaxed text-muted">
        {t("admin.thumbHelp")}
      </p>
      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
        <div className="flex gap-1.5">
          <dt className="text-muted">{t("admin.thumbRecommended")}:</dt>
          <dd className="font-semibold text-ink">1280 × 720 px (16:9)</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted">{t("admin.thumbFormats")}:</dt>
          <dd className="font-semibold text-ink">JPG · PNG · WebP</dd>
        </div>
      </dl>

      {/* Preview at the exact ratio a student sees on a course card. */}
      <figure className="space-y-2">
        <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <div className="aspect-video w-full">
            {url && status !== "error" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setProbe({ url, status: "error", dims: null })}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400">
                {status === "error" ? (
                  <>
                    <X className="h-5 w-5" />
                    <span className="text-[12px]">{t("admin.thumbBroken")}</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-[12px]">{t("admin.thumbEmpty")}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <figcaption className="text-[11.5px] text-muted">
          {t("admin.thumbPreviewNote")}
        </figcaption>
      </figure>

      {status === "warn" && dims ? (
        <p
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-900"
          role="status"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {t("admin.thumbRatioWarn")}{" "}
            <span className="font-semibold">
              ({dims.w} × {dims.h} px)
            </span>
          </span>
        </p>
      ) : null}

      {status === "ok" && dims ? (
        <p className="flex items-center gap-2 text-[12.5px] text-teal-700" role="status">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {t("admin.thumbRatioOk")} ({dims.w} × {dims.h} px)
        </p>
      ) : null}
    </div>
  );
}

export { TARGET_RATIO as THUMB_RATIO };
export default ThumbnailField;
