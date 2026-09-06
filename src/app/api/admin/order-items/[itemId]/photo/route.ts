import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { createPresignedDownloadUrl, deleteStorageObject } from "@/lib/storage";

/** The only way to ever read a child photo: authenticated admin session,
 * checked server-side, producing a short-lived signed URL. Never a
 * permanent public URL. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { itemId } = await params;
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { upload: true },
  });

  if (!orderItem?.upload || orderItem.upload.status !== "attached") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const url = await createPresignedDownloadUrl(orderItem.upload.storageKey);
  return NextResponse.json({ url });
}

/** Manual "Delete Child Photo Now" — explicit, irreversible, logged. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { itemId } = await params;
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { upload: true },
  });

  if (!orderItem?.upload || orderItem.upload.status !== "attached") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    await deleteStorageObject(orderItem.upload.storageKey);
  } catch (err) {
    console.error("[admin] failed to delete storage object", err);
  }

  await prisma.$transaction([
    prisma.upload.update({
      where: { id: orderItem.upload.id },
      data: { status: "deleted", deletedAt: new Date() },
    }),
    prisma.orderTimelineEntry.create({
      data: {
        orderId: orderItem.orderId,
        event: "photo_deleted_manually",
        actor: guard.session.email,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
