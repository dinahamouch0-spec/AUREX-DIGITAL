"use client";

import { Check, AlertCircle, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { PhotoUploader, type UploadValue } from "./PhotoUploader";
import { PriceDisplay } from "./PriceDisplay";

export interface CustomizerFieldOption {
  key: string;
  label: string;
  priceOverrideCents: number | null;
  priceModifierCents: number | null;
}

export interface CustomizerFieldDef {
  key: string;
  type: string;
  required: boolean;
  pricingRole: string;
  label: string;
  helpText: string | null;
  placeholder: string | null;
  defaultValue: string | null;
  options: CustomizerFieldOption[];
}

export function CustomizerField({
  field,
  value,
  onChange,
  error,
  uploadPreview,
  onUploadChange,
}: {
  field: CustomizerFieldDef;
  value: string | string[] | undefined;
  onChange: (value: string | string[] | undefined) => void;
  error?: string;
  uploadPreview?: UploadValue | null;
  onUploadChange?: (value: UploadValue | null) => void;
}) {
  if (field.type === "image_upload") {
    return (
      <PhotoUploader
        value={uploadPreview ?? null}
        onChange={(v) => {
          onUploadChange?.(v);
          onChange(v?.uploadId);
        }}
        label={field.label}
        hint={field.helpText ?? undefined}
        error={error}
        required={field.required}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`field-${field.key}`} className="text-sm font-semibold text-brand-navy">
        {field.label}
        {field.required && <span className="text-brand-pink"> *</span>}
      </label>
      {field.helpText && <p className="text-xs text-brand-navy-soft">{field.helpText}</p>}

      <FieldControl field={field} value={value} onChange={onChange} error={error} />

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-pink-deep" role="alert">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  error,
}: {
  field: CustomizerFieldDef;
  value: string | string[] | undefined;
  onChange: (value: string | string[] | undefined) => void;
  error?: string;
}) {
  const id = `field-${field.key}`;
  const errorClasses = error ? "border-brand-pink" : "border-brand-line";

  if (field.type === "short_text") {
    return (
      <input
        id={id}
        type="text"
        value={(value as string) ?? ""}
        placeholder={field.placeholder ?? undefined}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={cn(
          "min-h-11 rounded-xl border bg-white px-4 py-2.5 text-base text-brand-navy focus-visible:border-brand-pink",
          errorClasses
        )}
      />
    );
  }

  if (field.type === "long_text") {
    return (
      <textarea
        id={id}
        value={(value as string) ?? ""}
        placeholder={field.placeholder ?? undefined}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        aria-invalid={!!error}
        className={cn(
          "rounded-xl border bg-white px-4 py-2.5 text-base text-brand-navy focus-visible:border-brand-pink",
          errorClasses
        )}
      />
    );
  }

  if (field.type === "number") {
    const numValue = (value as string) ?? field.defaultValue ?? "1";
    const n = Number(numValue) || 0;
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="decrease"
          onClick={() => onChange(String(Math.max(1, n - 1)))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-line text-brand-navy hover:border-brand-pink hover:text-brand-pink-deep"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          value={numValue}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={cn(
            "min-h-11 w-20 rounded-xl border bg-white px-3 py-2.5 text-center text-base text-brand-navy focus-visible:border-brand-pink",
            errorClasses
          )}
        />
        <button
          type="button"
          aria-label="increase"
          onClick={() => onChange(String(n + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-line text-brand-navy hover:border-brand-pink hover:text-brand-pink-deep"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (field.type === "select" || field.type === "radio") {
    return (
      <div role="radiogroup" aria-label={field.label} className="flex flex-wrap gap-2">
        {field.options.map((opt) => {
          const selected = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.key)}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                selected
                  ? "border-brand-pink bg-blush text-brand-pink-deep"
                  : "border-brand-line bg-white text-brand-navy hover:border-brand-pink-soft"
              )}
            >
              {selected && <Check className="h-4 w-4" aria-hidden="true" />}
              {opt.label}
              {opt.priceOverrideCents !== null && (
                <PriceDisplay cents={opt.priceOverrideCents} className="text-xs opacity-75" />
              )}
              {opt.priceModifierCents !== null && opt.priceModifierCents !== 0 && (
                <span className="text-xs opacity-75">
                  {opt.priceModifierCents > 0 ? "+" : ""}
                  <PriceDisplay cents={opt.priceModifierCents} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === "checkbox") {
    const selectedKeys = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-wrap gap-2">
        {field.options.map((opt) => {
          const selected = selectedKeys.includes(opt.key);
          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                const next = selected
                  ? selectedKeys.filter((k) => k !== opt.key)
                  : [...selectedKeys, opt.key];
                onChange(next);
              }}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                selected
                  ? "border-brand-pink bg-blush text-brand-pink-deep"
                  : "border-brand-line bg-white text-brand-navy hover:border-brand-pink-soft"
              )}
            >
              {selected && <Check className="h-4 w-4" aria-hidden="true" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}
