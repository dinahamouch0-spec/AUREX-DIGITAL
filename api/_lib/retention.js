// Photo retention. Part 3 §33, §34, §35, §41.
//
// Two independent rules:
//   1. An upload that never became an order is abandoned and is removed.
//   2. A completed order's photos are removed after the grace period.
//
// Deleting a photo never deletes the order: business history survives, the
// image does not. §37

import { db, getSettings, audit, listOrders } from './db.js';

export async function runRetention(actor = 'system') {
  const settings = await getSettings();
  const now = Date.now();
  const result = { abandonedDeleted: 0, completedDeleted: 0, ordersUpdated: 0, checkedAt: new Date().toISOString() };

  /* --- 1. abandoned uploads ------------------------------------------- */
  const abandonMs = (settings.abandonedUploadHours || 48) * 3600_000;
  for (const rec of await db.uploads.all()) {
    if (rec.state !== 'temporary') continue;
    if (now - new Date(rec.createdAt).getTime() < abandonMs) continue;
    await db.files.del(rec.storageKey);
    await db.uploads.set(rec.token, {
      ...rec, state: 'deleted', deletedAt: new Date().toISOString(), deletedReason: 'abandoned',
    });
    await audit('photo_deleted', { token: rec.token, reason: 'abandoned' }, actor);
    result.abandonedDeleted++;
  }

  /* --- 2. completed orders past their grace period --------------------- */
  for (const order of await listOrders()) {
    if (!order.photoDeletionScheduledFor || order.photosDeletedAt) continue;
    if (new Date(order.photoDeletionScheduledFor).getTime() > now) continue;

    let removed = 0;
    const items = [];
    for (const item of order.items) {
      if (!item.photo || item.photo.state === 'deleted') { items.push(item); continue; }
      const rec = await db.uploads.get(item.photo.uploadToken);
      if (rec && rec.state !== 'deleted') {
        await db.files.del(rec.storageKey);
        await db.uploads.set(rec.token, {
          ...rec, state: 'deleted', deletedAt: new Date().toISOString(), deletedReason: 'retention',
        });
      }
      // The order keeps the record that a photo existed and that it is gone,
      // so the dashboard shows a deletion state rather than a broken image.
      items.push({ ...item, photo: { ...item.photo, state: 'deleted' } });
      removed++;
    }

    if (removed) {
      await db.orders.set(order.id, {
        ...order, items,
        photosDeletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await audit('photo_deleted', {
        orderId: order.id, orderNumber: order.orderNumber, count: removed, reason: 'retention',
      }, actor);
      result.completedDeleted += removed;
      result.ordersUpdated++;
    }
  }

  return result;
}
