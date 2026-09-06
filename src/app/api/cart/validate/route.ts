import { NextRequest, NextResponse } from "next/server";
import { getProductByIdLocalized } from "@/lib/catalog";
import { calculatePrice, validateAnswers, PricingValidationError } from "@/lib/pricing";
import { validateCartSchema } from "@/lib/order-schema";
import type { Locale } from "@prisma/client";

/** Called right before checkout to catch anything that went stale since
 * the item was added to cart: the product going unavailable, an option
 * being disabled, or the price simply changing. Never trusts the client's
 * price — always re-derives it from the current product configuration. */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = validateCartSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const locale = (req.headers.get("x-locale") as Locale) || "en";

  const results = await Promise.all(
    parsed.data.items.map(async (item) => {
      const product = await getProductByIdLocalized(item.productId, locale);

      if (!product || product.status !== "active") {
        return {
          cartItemId: item.cartItemId,
          ok: false,
          unavailable: true,
          priceChanged: false,
          currentLineTotalCents: null,
          invalidFieldKeys: [] as string[],
        };
      }

      try {
        validateAnswers(product, item.answers);
      } catch (err) {
        const fieldKey = err instanceof PricingValidationError ? err.fieldKey : "";
        return {
          cartItemId: item.cartItemId,
          ok: false,
          unavailable: false,
          priceChanged: false,
          currentLineTotalCents: null,
          invalidFieldKeys: fieldKey ? [fieldKey] : [],
        };
      }

      const price = calculatePrice(product, item.answers);
      const priceChanged = price.lineTotalCents !== item.clientLineTotalCents;

      return {
        cartItemId: item.cartItemId,
        ok: true,
        unavailable: false,
        priceChanged,
        currentLineTotalCents: price.lineTotalCents,
        invalidFieldKeys: [],
      };
    })
  );

  return NextResponse.json({ results });
}
