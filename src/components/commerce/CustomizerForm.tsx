"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  calculatePrice,
  validateAnswers,
  PricingValidationError,
  formatCentsUSD,
  type AnswerMap,
} from "@/lib/pricing";
import { CustomizerField, type CustomizerFieldDef } from "./CustomizerField";
import type { UploadValue } from "./PhotoUploader";
import { useCartStore, type CartAnswerDisplay } from "@/store/cart";
import { Button } from "@/components/shared/Button";
import { ShieldCheck } from "lucide-react";

export interface CustomizerProduct {
  id: string;
  slug: string;
  name: string;
  category: { slug: string; name: string };
  basePriceCents: number | null;
  unitPriceCents: number | null;
  images: { url: string; alt: string }[];
  customizationFields: CustomizerFieldDef[];
}

const errorKeyFor: Record<string, string> = {
  required: "fieldRequired",
  invalid_quantity: "invalidQuantity",
  invalid_option: "invalidOption",
};

export function CustomizerForm({ product }: { product: CustomizerProduct }) {
  const t = useTranslations("customizer");
  const tProduct = useTranslations("product");
  const locale = useLocale() as "ar" | "en";
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const { items, addItem, updateItem } = useCartStore();
  const editingItem = editId ? items.find((i) => i.id === editId) : undefined;

  const [answers, setAnswers] = useState<AnswerMap>(() => {
    if (editingItem) return editingItem.answers;
    const initial: AnswerMap = {};
    for (const field of product.customizationFields) {
      if (field.defaultValue) initial[field.key] = field.defaultValue;
      else if (field.type === "number") initial[field.key] = "1";
    }
    return initial;
  });

  const [uploadPreviews, setUploadPreviews] = useState<Record<string, UploadValue | null>>(
    () => {
      if (editingItem?.uploadId) {
        const photoField = product.customizationFields.find((f) => f.type === "image_upload");
        if (photoField) {
          return {
            [photoField.key]: {
              uploadId: editingItem.uploadId,
              previewUrl: editingItem.image ?? "",
            },
          };
        }
      }
      return {};
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const priceResult = useMemo(() => calculatePrice(product, answers), [product, answers]);

  function setAnswer(key: string, value: string | string[] | undefined) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function buildAnswersDisplay(): CartAnswerDisplay[] {
    const display: CartAnswerDisplay[] = [];
    for (const field of product.customizationFields) {
      if (field.type === "image_upload") continue;
      const value = answers[field.key];
      if (value === undefined || value === "") continue;

      let valueLabel: string;
      if (field.type === "select" || field.type === "radio") {
        valueLabel = field.options.find((o) => o.key === value)?.label ?? String(value);
      } else if (field.type === "checkbox" && Array.isArray(value)) {
        valueLabel = value
          .map((k) => field.options.find((o) => o.key === k)?.label ?? k)
          .join(", ");
      } else {
        valueLabel = String(value);
      }
      display.push({ fieldKey: field.key, label: field.label, valueLabel });
    }
    return display;
  }

  function handleSubmit() {
    setErrors({});
    try {
      validateAnswers(product, answers);
    } catch (err) {
      if (err instanceof PricingValidationError) {
        setErrors({ [err.fieldKey]: t(errorKeyFor[err.message] ?? "fieldRequired") });
        const el = document.getElementById(`field-${err.fieldKey}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);

    const photoField = product.customizationFields.find((f) => f.type === "image_upload");
    const uploadId = photoField ? (answers[photoField.key] as string | undefined) : undefined;
    const preview = photoField ? uploadPreviews[photoField.key] : null;

    const childNameField = product.customizationFields.find((f) => f.key === "child_name");
    const childName = childNameField
      ? (answers[childNameField.key] as string | undefined)
      : undefined;

    const itemData = {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      categorySlug: product.category.slug,
      image: product.images[0]?.url ?? preview?.previewUrl,
      answers,
      answersDisplay: buildAnswersDisplay(),
      childName,
      quantity: priceResult.quantity,
      unitPriceCents: priceResult.unitPriceCents,
      lineTotalCents: priceResult.lineTotalCents,
      uploadId,
      hasPhoto: !!uploadId,
    };

    if (editingItem) {
      updateItem(editingItem.id, itemData);
    } else {
      addItem(itemData);
    }

    router.push("/cart");
  }

  return (
    <div className="flex flex-col gap-6 pb-28 lg:pb-0">
      {product.customizationFields.map((field) => (
        <CustomizerField
          key={field.key}
          field={field}
          value={answers[field.key]}
          onChange={(v) => setAnswer(field.key, v)}
          error={errors[field.key]}
          uploadPreview={uploadPreviews[field.key]}
          onUploadChange={(v) =>
            setUploadPreviews((prev) => ({ ...prev, [field.key]: v }))
          }
        />
      ))}

      <p className="flex items-start gap-2 rounded-xl bg-blush/60 p-3 text-xs text-brand-navy-soft">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-pink-deep" aria-hidden="true" />
        {tProduct("privacyNear")}
      </p>

      <div className="rounded-[var(--radius-card)] border border-brand-line bg-white p-5">
        <p className="mb-3 text-sm font-bold text-brand-navy">{t("reviewTitle")}</p>
        <dl className="flex flex-col gap-1.5 text-sm">
          {buildAnswersDisplay().map((a) => (
            <div key={a.fieldKey} className="flex justify-between gap-4">
              <dt className="text-brand-navy-soft">{a.label}</dt>
              <dd className="text-end font-medium text-brand-navy">{a.valueLabel}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex items-center justify-between border-t border-brand-line pt-3">
          <span className="font-bold text-brand-navy">{t("total")}</span>
          <span className="text-lg font-extrabold text-brand-pink-deep">
            {formatCentsUSD(priceResult.lineTotalCents, locale)}
          </span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-brand-line bg-white p-4 shadow-[0_-6px_20px_-10px_rgba(36,27,78,0.2)] lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="lg:hidden">
          <p className="text-xs text-brand-navy-soft">{t("total")}</p>
          <p className="text-lg font-extrabold text-brand-pink-deep">
            {formatCentsUSD(priceResult.lineTotalCents, locale)}
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={submitting} size="lg" className="grow lg:w-full">
          {editingItem ? t("updateCartItem") : t("addToCart")}
        </Button>
      </div>
    </div>
  );
}
