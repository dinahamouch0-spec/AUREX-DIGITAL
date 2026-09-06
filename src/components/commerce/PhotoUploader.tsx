"use client";

import { useRef, useState, useCallback, useId } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Camera, X, AlertCircle, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/cn";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_BYTES = 15 * 1024 * 1024;

export interface UploadValue {
  uploadId: string;
  previewUrl: string;
}

type Status = "idle" | "uploading" | "done" | "error";

export function PhotoUploader({
  value,
  onChange,
  label,
  hint,
  error,
  required,
}: {
  value: UploadValue | null;
  onChange: (value: UploadValue | null) => void;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  const t = useTranslations("customizer");
  const inputId = useId();
  const tCommon = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(value ? "done" : "idle");
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setLocalError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setLocalError(t("uploadInvalidType"));
        setStatus("error");
        return;
      }
      if (file.size > MAX_BYTES) {
        setLocalError(t("uploadTooLarge"));
        setStatus("error");
        return;
      }

      setStatus("uploading");
      setProgress(0);
      const previewUrl = URL.createObjectURL(file);

      try {
        const initRes = await fetch("/api/uploads/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mimeType: file.type, sizeBytes: file.size }),
        });

        if (!initRes.ok) {
          const body = await initRes.json().catch(() => ({}));
          if (body?.error === "STORAGE_NOT_CONFIGURED") {
            setLocalError(
              "Photo storage isn't configured in this environment yet."
            );
          } else {
            setLocalError(t("uploadFailed"));
          }
          setStatus("error");
          return;
        }

        const { uploadId, uploadUrl } = await initRes.json();

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`upload_failed_${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error("upload_network_error"));
          xhr.send(file);
        });

        setStatus("done");
        onChange({ uploadId, previewUrl });
      } catch {
        setLocalError(t("uploadFailed"));
        setStatus("error");
      }
    },
    [onChange, t]
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      fetch(`/api/uploads/${value.uploadId}`, { method: "DELETE" }).catch(() => {});
      URL.revokeObjectURL(value.previewUrl);
    }
    onChange(null);
    setStatus("idle");
    setProgress(0);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [value, onChange]);

  const displayError = error || localError;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-semibold text-brand-navy">
        {label}
        {required && <span className="text-brand-pink"> *</span>}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        capture="environment"
        className="sr-only"
        id={inputId}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />

      {status === "done" && value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
            <Image src={value.previewUrl} alt="" fill className="object-cover" unoptimized />
          </div>
          <div className="flex min-w-0 grow items-center gap-1.5 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            {tCommon("uploaded")}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="min-h-11 shrink-0 rounded-full border border-brand-line px-3 text-xs font-semibold text-brand-navy hover:border-brand-pink hover:text-brand-pink-deep"
          >
            {t("replacePhoto")}
          </button>
          <button
            type="button"
            onClick={handleRemove}
            aria-label={t("removePhoto")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-navy-soft hover:bg-blush hover:text-brand-pink-deep"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading"}
          className={cn(
            "flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center transition-colors",
            displayError
              ? "border-brand-pink/50 bg-blush"
              : "border-brand-line bg-white hover:border-brand-pink hover:bg-blush/40"
          )}
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-brand-pink" aria-hidden="true" />
              <span className="text-sm font-semibold text-brand-navy">
                {t("uploading")} {progress}%
              </span>
            </>
          ) : (
            <>
              <Camera className="h-6 w-6 text-brand-pink" aria-hidden="true" />
              <span className="text-sm font-semibold text-brand-navy">{t("photoUploadHint")}</span>
            </>
          )}
        </button>
      )}

      {hint && !displayError && <p className="text-xs text-brand-navy-soft">{hint}</p>}
      {displayError && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-pink-deep" role="alert">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {displayError}
        </p>
      )}
    </div>
  );
}
