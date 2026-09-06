import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getProductByIdLocalized } from "@/lib/catalog";
import { calculatePrice, validateAnswers, PricingValidationError } from "@/lib/pricing";
import { createOrderSchema } from "@/lib/order-schema";
import { nextOrderNumber } from "@/lib/order-number";
import { getBusinessSettings } from "@/lib/settings";
import { sendAdminNewOrderEmail, sendCustomerOrderConfirmationEmail } from "@/lib/email";
import { formatCentsUSD } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Idempotent replay: if this exact submission already produced an
  // order (double-tap, retried request after a dropped response), hand
  // back the same order instead of creating a second one.
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { orderNumber: true, confirmationToken: true },
  });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  // Re-derive everything server-side. The client's prices/answers are
  // treated as untrusted input from here on.
  type ResolvedItem = {
    productId: string;
    productName: string;
    productSlug: string;
    imageUrl: string | null;
    quantity: number;
    unitPriceCents: number | null;
    lineTotalCents: number;
    uploadId?: string;
    answers: {
      fieldKey: string;
      label: string;
      value: string | null;
      optionLabel: string | null;
    }[];
  };

  const resolved: ResolvedItem[] = [];
  const itemErrors: { index: number; error: string; fieldKey?: string }[] = [];

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    const product = await getProductByIdLocalized(item.productId, input.locale);

    if (!product || product.status !== "active") {
      itemErrors.push({ index: i, error: "PRODUCT_UNAVAILABLE" });
      continue;
    }

    try {
      validateAnswers(product, item.answers);
    } catch (err) {
      itemErrors.push({
        index: i,
        error: "INVALID_ANSWERS",
        fieldKey: err instanceof PricingValidationError ? err.fieldKey : undefined,
      });
      continue;
    }

    let verifiedUploadId: string | undefined;
    const photoField = product.customizationFields.find((f) => f.type === "image_upload");
    if (photoField) {
      const uploadId = item.answers[photoField.key];
      if (typeof uploadId === "string" && uploadId) {
        const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
        if (!upload || upload.status !== "temporary") {
          itemErrors.push({ index: i, error: "INVALID_UPLOAD", fieldKey: photoField.key });
          continue;
        }
        verifiedUploadId = uploadId;
      }
    }

    const price = calculatePrice(product, item.answers);

    const answerSnapshots = product.customizationFields
      .filter((f) => f.type !== "image_upload")
      .map((f) => {
        const raw = item.answers[f.key];
        if (raw === undefined) return null;

        let optionLabel: string | null = null;
        if (f.type === "select" || f.type === "radio") {
          optionLabel = f.options.find((o) => o.key === raw)?.label ?? null;
        } else if (f.type === "checkbox" && Array.isArray(raw)) {
          optionLabel = raw
            .map((k) => f.options.find((o) => o.key === k)?.label ?? k)
            .join(", ");
        }

        return {
          fieldKey: f.key,
          label: f.label,
          value: Array.isArray(raw) ? raw.join(",") : raw,
          optionLabel,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    resolved.push({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.images[0]?.url ?? null,
      quantity: price.quantity,
      unitPriceCents: price.unitPriceCents,
      lineTotalCents: price.lineTotalCents,
      uploadId: verifiedUploadId,
      answers: answerSnapshots,
    });
  }

  if (itemErrors.length > 0) {
    return NextResponse.json({ error: "ITEMS_INVALID", itemErrors }, { status: 409 });
  }

  const productsSubtotalCents = resolved.reduce((sum, i) => sum + i.lineTotalCents, 0);
  const orderNumber = await nextOrderNumber();
  const confirmationToken = nanoid(32);

  let orderId: string;
  try {
    orderId = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          confirmationToken,
          customerName: input.customer.fullName,
          phone: input.customer.phone,
          email: input.customer.email || null,
          country: input.delivery.country,
          city: input.delivery.city,
          address: input.delivery.address,
          addressNotes: input.delivery.addressNotes || null,
          locale: input.locale,
          productsSubtotalCents,
          paymentMethod: input.paymentMethod,
          idempotencyKey: input.idempotencyKey,
        },
      });

      for (const item of resolved) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productNameSnapshot: item.productName,
            productSlugSnapshot: item.productSlug,
            imageUrlSnapshot: item.imageUrl,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
          },
        });

        if (item.answers.length > 0) {
          await tx.customizationAnswer.createMany({
            data: item.answers.map((a) => ({
              orderItemId: orderItem.id,
              fieldKey: a.fieldKey,
              labelSnapshot: a.label,
              value: a.value,
              optionLabelSnapshot: a.optionLabel,
            })),
          });
        }

        if (item.uploadId) {
          await tx.upload.update({
            where: { id: item.uploadId },
            data: { status: "attached", orderItemId: orderItem.id, attachedAt: new Date() },
          });
        }
      }

      await tx.orderTimelineEntry.create({
        data: { orderId: order.id, event: "order_created", actor: "customer" },
      });

      return order.id;
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Concurrent duplicate submission raced us — hand back the winner.
      const winner = await prisma.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { orderNumber: true, confirmationToken: true },
      });
      if (winner) return NextResponse.json(winner, { status: 200 });
    }
    console.error("[orders] failed to create order", err);
    return NextResponse.json({ error: "ORDER_CREATION_FAILED" }, { status: 500 });
  }

  void orderId;

  // Best-effort notifications — never fail the order over these.
  const settings = await getBusinessSettings();
  const productSummaries = resolved.map(
    (i) => `${i.productName} × ${i.quantity} — ${formatCentsUSD(i.lineTotalCents, "en")}`
  );
  const notifyEmail = settings.adminNotifyEmail || settings.businessEmail;
  if (notifyEmail) {
    void sendAdminNewOrderEmail(notifyEmail, {
      orderNumber,
      customerName: input.customer.fullName,
      productSummaries,
      paymentMethod: input.paymentMethod,
      subtotalFormatted: formatCentsUSD(productsSubtotalCents, "en"),
    });
  }
  if (input.customer.email) {
    void sendCustomerOrderConfirmationEmail(input.customer.email, {
      orderNumber,
      productSummaries,
      subtotalFormatted: formatCentsUSD(productsSubtotalCents, input.locale),
      paymentMethod: input.paymentMethod,
      locale: input.locale,
    });
  }

  return NextResponse.json({ orderNumber, confirmationToken }, { status: 201 });
}
