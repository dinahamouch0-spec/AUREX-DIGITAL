import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteStorageObject } from "@/lib/storage";

/** Lets the customer remove/replace a photo they just uploaded, before
 * it's attached to an order. Only ever deletes uploads still in
 * "temporary" state — never touches anything already tied to an order. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const upload = await prisma.upload.findUnique({ where: { id } });
  if (!upload || upload.status !== "temporary") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    await deleteStorageObject(upload.storageKey);
  } catch (err) {
    console.error("[uploads] failed to delete storage object", err);
  }

  await prisma.upload.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
