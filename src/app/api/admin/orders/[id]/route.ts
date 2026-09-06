import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { getBusinessSettings } from "@/lib/settings";

const schema = z.object({
  paymentStatus: z
    .enum(["pending", "pending_verification", "confirmed", "cod", "failed_rejected"])
    .optional(),
  productionStatus: z
    .enum([
      "new", "designing", "waiting_approval", "revision_requested",
      "approved", "printing", "ready", "shipped", "completed", "cancelled",
    ])
    .optional(),
  shippingCostCents: z.number().int().min(0).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const data = parsed.data;
  const timelineEntries: { event: string }[] = [];

  const updateData: Record<string, unknown> = {};

  if (data.paymentStatus && data.paymentStatus !== order.paymentStatus) {
    updateData.paymentStatus = data.paymentStatus;
    timelineEntries.push({ event: `payment_status_changed:${order.paymentStatus}->${data.paymentStatus}` });
  }

  if (data.productionStatus && data.productionStatus !== order.productionStatus) {
    updateData.productionStatus = data.productionStatus;
    timelineEntries.push({ event: `production_status_changed:${order.productionStatus}->${data.productionStatus}` });
    if (data.productionStatus === "completed") {
      updateData.completedAt = new Date();
    }
  }

  if (data.shippingCostCents !== undefined) {
    updateData.shippingCostCents = data.shippingCostCents;
    updateData.finalTotalCents =
      data.shippingCostCents === null
        ? null
        : order.productsSubtotalCents + data.shippingCostCents;
    timelineEntries.push({ event: `shipping_cost_set:${data.shippingCostCents}` });
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: updateData });
    for (const entry of timelineEntries) {
      await tx.orderTimelineEntry.create({
        data: { orderId: id, event: entry.event, actor: guard.session.email },
      });
    }

    // Business requirement: don't retain the child's photo after the
    // order is completed. Schedule deletion rather than deleting
    // immediately, to protect against an accidental status change.
    if (data.productionStatus === "completed") {
      const settings = await getBusinessSettings();
      const deleteAfter = new Date(
        Date.now() + settings.photoRetentionHours * 60 * 60 * 1000
      );
      const items = await tx.orderItem.findMany({
        where: { orderId: id },
        include: { upload: true },
      });
      for (const item of items) {
        if (item.upload && item.upload.status === "attached") {
          await tx.upload.update({
            where: { id: item.upload.id },
            data: { deleteAfter },
          });
        }
      }
      await tx.orderTimelineEntry.create({
        data: {
          orderId: id,
          event: `photo_deletion_scheduled:${deleteAfter.toISOString()}`,
          actor: "system",
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
