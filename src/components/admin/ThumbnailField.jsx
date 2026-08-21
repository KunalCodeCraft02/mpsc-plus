"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, AlertTriangle, CheckCircle2, X, Upload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { adminService } from "@/services/api";
import { useToast } from "@/context/ToastContext";

/** Course cards, listings and the course hero all render 16:9. */
const TARGET_RATIO = 16 / 9;
/** ±4% tolerance — 1280×720, 1600×900 and 1920×1080 all pass. */
const TOLERANCE = 0.04;

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_EXT = "image/jpeg,image/jpg,image/png,image/webp";
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Thumbnail picker for the admin course form.
 *
 * The admin picks a file from their device — no URL to paste. The file is
 * validated, previewed at the ratio students will actually see it at, and
 * uploaded straight to Cloudinary using a short-lived signature from the
 * backend (the Cloudinary API secret never reaches the browser). Once
 * uploaded, the field's value becomes the persistent Cloudinary URL, which
 * saves with the course exactly like any other field.
 */
export function ThumbnailField({ value, error, setValue, name, t }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [probe, setProbe] = useState({ url: "", status: "idle", dims: null });
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState("");

  const savedUrl = (value || "").trim();
  const url = localPreview || savedUrl;

  useEffect(() => {
    if (!url) return undefined;
    const id = setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const off = Math.abs(w / h - TARGET_RATIO) / TARGET_RATIO;
        setProbe({ url, status: off <= TOLERANCE ? "ok" : "warn", dims: { w, h } });
      };
      img.onerror = () => setProbe({ url, status: "error", dims: null });
      img.src = url;
    }, 200);
    return () => clearTimeout(id);
  }, [url]);

  // Release the object URL once it's no longer the active preview.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const measured = probe.url === url;
  const status = !url ? "idle" : measured ? probe.status : "loading";
  const dims = measured ? probe.dims : null;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is too large — please use a file under 8 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setFileName(file.name);
    setUploading(true);
    try {
      const sig = await adminService.cloudinarySignature();
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", sig.timestamp);
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.secure_url) {
        throw new Error(data?.error?.message || "Upload failed");
      }

      setValue(name, data.secure_url, { shouldDirty: true });
      toast.success("Thumbnail uploaded");
    } catch (err) {
      toast.error(err.message || "Could not upload the thumbnail. Please try again.");
      setLocalPreview("");
      setFileName("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT}
        className="hidden"
        onChange={onFile}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={url ? RefreshCw : Upload}
          loading={uploading}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : url ? "Change Image" : "Upload Thumbnail"}
        </Button>
        {fileName ? <span className="truncate text-[12px] text-muted">{fileName}</span> : null}
      </div>

      {error ? <p className="text-xs font-medium text-accent-600">{error}</p> : null}

      <p className="text-[12.5px] leading-relaxed text-muted">{t("admin.thumbHelp")}</p>
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
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              </div>
            ) : null}
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
