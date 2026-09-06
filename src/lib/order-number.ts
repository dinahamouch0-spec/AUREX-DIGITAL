import { prisma } from "@/lib/prisma";

/** Atomically increments the shared counter and returns a friendly
 * customer-facing order number like "YK-1042". Never exposes raw DB ids. */
export async function nextOrderNumber(): Promise<string> {
  const rows = await prisma.$queryRaw<{ value: number }[]>`
    INSERT INTO order_counters (id, value)
    VALUES ('singleton', 1001)
    ON CONFLICT (id) DO UPDATE SET value = order_counters.value + 1
    RETURNING value;
  `;
  const value = rows[0]?.value ?? 1000;
  return `YK-${value}`;
}
