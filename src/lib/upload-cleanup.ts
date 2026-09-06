import { prisma } from "@/lib/prisma";
import { deleteStorageObject } from "@/lib/storage";
import { getBusinessSettings } from "@/lib/settings";

export interface CleanupResult {
  completedPhotosDeleted: number;
  abandonedUploadsDeleted: number;
  errors: string[];
}

/** Two independent sweeps, both required by the privacy policy:
 *  1. Photos on completed orders past their scheduled retention window.
 *  2. Uploads that were never attached to an order (abandoned mid-checkout).
 * Safe to run repeatedly — anything already deleted is skipped. */
export async function runUploadCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    completedPhotosDeleted: 0,
    abandonedUploadsDeleted: 0,
    errors: [],
  };

  const now = new Date();

  const dueForDeletion = await prisma.upload.findMany({
    where: { status: "attached", deleteAfter: { lte: now } },
    include: { orderItem: true },
  });

  for (const upload of dueForDeletion) {
    try {
      await deleteStorageObject(upload.storageKey);
      await prisma.$transaction([
        prisma.upload.update({
          where: { id: upload.id },
          data: { status: "deleted", deletedAt: new Date() },
        }),
        ...(upload.orderItem
          ? [
              prisma.orderTimelineEntry.create({
                data: {
                  orderId: upload.orderItem.orderId,
                  event: "photo_deleted",
                  actor: "system",
                },
              }),
            ]
          : []),
      ]);
      result.completedPhotosDeleted++;
    } catch (err) {
      result.errors.push(`upload ${upload.id}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  const settings = await getBusinessSettings();
  const abandonedCutoff = new Date(
    now.getTime() - settings.tempUploadRetentionHours * 60 * 60 * 1000
  );

  const abandoned = await prisma.upload.findMany({
    where: { status: "temporary", createdAt: { lte: abandonedCutoff } },
  });

  for (const upload of abandoned) {
    try {
      await deleteStorageObject(upload.storageKey);
      await prisma.upload.update({
        where: { id: upload.id },
        data: { status: "deleted", deletedAt: new Date() },
      });
      result.abandonedUploadsDeleted++;
    } catch (err) {
      result.errors.push(`upload ${upload.id}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return result;
}
