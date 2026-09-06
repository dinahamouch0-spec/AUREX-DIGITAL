"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { nanoid } from "nanoid";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/States";
import { useCartStore, cartSubtotalCents } from "@/store/cart";
import { useHasMounted } from "@/lib/use-has-mounted";
import { formatCentsUSD } from "@/lib/pricing";
import { cn } from "@/lib/cn";

interface ValidateResult {
  cartItemId: string;
  ok: boolean;
  unavailable: boolean;
  priceChanged: boolean;
  currentLineTotalCents: number | null;
  invalidFieldKeys: string[];
}

const IDEMPOTENCY_KEY_STORAGE = "ya7kayti-checkout-idempotency-key";

export function CheckoutView({ whishNumber }: { whishNumber: string }) {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const locale = useLocale() as "ar" | "en";
  const router = useRouter();
  const { items, updateItem, clear } = useCartStore();

  const mounted = useHasMounted();
  const [validation, setValidation] = useState<Record<string, ValidateResult>>({});
  const [validating, setValidating] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("Lebanon");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "whish">("cod");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!mounted || items.length === 0) return;
    let cancelled = false;
    // Data-fetching effect: setting the loading flag before the request
    // starts is the standard pattern here, not a cascading-render bug.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValidating(true);

    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-locale": locale },
      body: JSON.stringify({
        items: items.map((i) => ({
          cartItemId: i.id,
          productId: i.productId,
          answers: i.answers,
          clientLineTotalCents: i.lineTotalCents,
        })),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const map: Record<string, ValidateResult> = {};
        for (const r of data.results as ValidateResult[]) {
          map[r.cartItemId] = r;
          if (r.ok && r.priceChanged && r.currentLineTotalCents !== null) {
            const item = items.find((i) => i.id === r.cartItemId);
            if (item) updateItem(item.id, { ...item, lineTotalCents: r.currentLineTotalCents });
          }
        }
        setValidation(map);
      })
      .catch(() => {
        // Validation being unreachable shouldn't hard-block checkout —
        // the order API re-validates authoritatively regardless.
      })
      .finally(() => !cancelled && setValidating(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const idempotencyKey = useMemo(() => {
    if (typeof window === "undefined") return "";
    let key = sessionStorage.getItem(IDEMPOTENCY_KEY_STORAGE);
    if (!key) {
      key = nanoid(24);
      sessionStorage.setItem(IDEMPOTENCY_KEY_STORAGE, key);
    }
    return key;
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <Container className="py-14">
        <EmptyState title={t("title")} action={<Button href="/shop">{t("reviewOrder")}</Button>} />
      </Container>
    );
  }

  const subtotal = cartSubtotalCents(items);
  const blockingItems = items.filter((i) => {
    const v = validation[i.id];
    return v && (v.unavailable || v.invalidFieldKeys.length > 0);
  });
  const hasBlockingIssues = blockingItems.length > 0;
  const priceChangedItems = items.filter((i) => validation[i.id]?.priceChanged);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (fullName.trim().length < 2) errors.fullName = t("fullName");
    if (phone.trim().length < 4) errors.phone = t("phone");
    if (country.trim().length < 1) errors.country = t("country");
    if (city.trim().length < 1) errors.city = t("city");
    if (address.trim().length < 3) errors.address = t("address");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handlePlaceOrder() {
    setSubmitError(null);
    if (hasBlockingIssues) return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          locale,
          customer: { fullName, phone, email: email || undefined },
          delivery: { country, city, address, addressNotes: addressNotes || undefined },
          paymentMethod,
          items: items.map((i) => ({
            productId: i.productId,
            answers: i.answers,
            uploadId: i.uploadId,
          })),
        }),
      });

      if (!res.ok) {
        setSubmitError(t("orderError"));
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      sessionStorage.removeItem(IDEMPOTENCY_KEY_STORAGE);
      clear();
      router.push(`/order-confirmation/${data.confirmationToken}`);
    } catch {
      setSubmitError(t("orderError"));
      setSubmitting(false);
    }
  }

  return (
    <div className="py-10 sm:py-14">
      <Container className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-brand-navy-soft">{t("guestNotice")}</p>
        </div>

        {hasBlockingIssues && (
          <div role="alert" className="rounded-2xl border border-brand-pink/40 bg-blush p-4">
            <p className="mb-2 font-bold text-brand-pink-deep">{t("staleItemsTitle")}</p>
            <ul className="flex flex-col gap-1 text-sm text-brand-navy">
              {blockingItems.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3">
                  <span>
                    {i.productName}
                    {i.childName ? ` — ${i.childName}` : ""}:{" "}
                    {validation[i.id]?.unavailable
                      ? tCart("itemUnavailable")
                      : tCart("optionUnavailable")}
                  </span>
                  <Link href={`/product/${i.productSlug}?edit=${i.id}`} className="font-semibold text-brand-pink-deep hover:underline">
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {priceChangedItems.length > 0 && !hasBlockingIssues && (
          <div className="rounded-2xl border border-brand-gold/50 bg-brand-gold-soft/20 p-4 text-sm text-brand-navy">
            {priceChangedItems.map((i) => (
              <p key={i.id}>{i.productName}: price updated to current total.</p>
            ))}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <section className="rounded-[var(--radius-card)] border border-brand-line bg-white p-5">
              <h2 className="mb-4 text-lg font-bold text-brand-navy">{t("customerInfo")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label={t("fullName")} value={fullName} onChange={setFullName} error={fieldErrors.fullName} required />
                <TextField label={t("phone")} value={phone} onChange={setPhone} error={fieldErrors.phone} required type="tel" />
                <TextField label={t("email")} value={email} onChange={setEmail} type="email" className="sm:col-span-2" />
              </div>
            </section>

            <section className="rounded-[var(--radius-card)] border border-brand-line bg-white p-5">
              <h2 className="mb-4 text-lg font-bold text-brand-navy">{t("deliveryInfo")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label={t("country")} value={country} onChange={setCountry} error={fieldErrors.country} required />
                <TextField label={t("city")} value={city} onChange={setCity} error={fieldErrors.city} required />
                <TextField label={t("address")} value={address} onChange={setAddress} error={fieldErrors.address} required className="sm:col-span-2" />
                <TextField label={t("addressNotes")} value={addressNotes} onChange={setAddressNotes} className="sm:col-span-2" />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-blush/60 px-4 py-2.5 text-sm font-semibold text-brand-navy">
                <span>{t("shippingLabel")}</span>
                <span>{t("shippingTbc")}</span>
              </div>
            </section>

            <section className="rounded-[var(--radius-card)] border border-brand-line bg-white p-5">
              <h2 className="mb-4 text-lg font-bold text-brand-navy">{t("paymentMethod")}</h2>
              <div className="flex flex-col gap-3">
                <PaymentOption
                  selected={paymentMethod === "cod"}
                  onSelect={() => setPaymentMethod("cod")}
                  label={t("cod")}
                />
                <PaymentOption
                  selected={paymentMethod === "whish"}
                  onSelect={() => setPaymentMethod("whish")}
                  label={t("whish")}
                  hint={whishNumber ? t("whishHint", { number: whishNumber }) : undefined}
                />
              </div>
            </section>
          </div>

          <div className="h-fit flex flex-col gap-4 rounded-[var(--radius-card)] border border-brand-line bg-white p-5">
            <h2 className="text-lg font-bold text-brand-navy">{t("reviewOrder")}</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="text-brand-navy-soft">
                    {i.productName} × {i.quantity}
                  </span>
                  <span className="font-semibold text-brand-navy">
                    {formatCentsUSD(i.lineTotalCents, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-brand-line pt-3 text-sm">
              <span className="text-brand-navy-soft">{t("productsSubtotal")}</span>
              <span className="font-semibold text-brand-navy">{formatCentsUSD(subtotal, locale)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-navy-soft">{t("shippingLabel")}</span>
              <span className="font-semibold text-brand-navy">{t("shippingTbc")}</span>
            </div>

            {submitError && (
              <p role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-brand-pink-deep">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {submitError}
              </p>
            )}

            <Button
              onClick={handlePlaceOrder}
              disabled={submitting || validating || hasBlockingIssues}
              size="lg"
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t("placingOrder")}
                </>
              ) : (
                t("placeOrder")
              )}
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-brand-navy-soft">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t("guestNotice")}
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-semibold text-brand-navy">
        {label}
        {required && <span className="text-brand-pink"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={cn(
          "min-h-11 rounded-xl border bg-white px-4 py-2.5 text-base text-brand-navy focus-visible:border-brand-pink",
          error ? "border-brand-pink" : "border-brand-line"
        )}
      />
      {error && <p className="text-xs font-semibold text-brand-pink-deep">{error}</p>}
    </div>
  );
}

function PaymentOption({
  selected,
  onSelect,
  label,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-1 rounded-xl border-2 p-4 text-start transition-colors",
        selected ? "border-brand-pink bg-blush" : "border-brand-line bg-white hover:border-brand-pink-soft"
      )}
    >
      <span className="flex items-center gap-2 font-semibold text-brand-navy">
        <span
          className={cn(
            "h-4 w-4 shrink-0 rounded-full border-2",
            selected ? "border-brand-pink bg-brand-pink" : "border-brand-line"
          )}
        />
        {label}
      </span>
      {hint && selected && <p className="text-xs text-brand-navy-soft">{hint}</p>}
    </button>
  );
}
