import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCentsUSD } from "@/lib/pricing";
import { StatusBadge } from "@/components/admin/AdminUI";
import type { Prisma } from "@prisma/client";

const PRODUCTION_STATUSES = [
  "new", "designing", "waiting_approval", "revision_requested",
  "approved", "printing", "ready", "shipped", "completed", "cancelled",
];
const PAYMENT_STATUSES = ["pending", "pending_verification", "confirmed", "cod", "failed_rejected"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; production?: string; payment?: string; method?: string }>;
}) {
  const { q, production, payment, method } = await searchParams;

  const where: Prisma.OrderWhereInput = {};
  if (production) where.productionStatus = production as never;
  if (payment) where.paymentStatus = payment as never;
  if (method) where.paymentMethod = method as never;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-brand-navy">Orders</h1>

      <form className="flex flex-wrap gap-3 rounded-2xl border border-brand-line bg-white p-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search order #, name, or phone"
          className="min-h-11 grow rounded-xl border border-brand-line px-4 py-2 text-sm"
        />
        <select name="production" defaultValue={production ?? ""} className="min-h-11 rounded-xl border border-brand-line px-3 py-2 text-sm">
          <option value="">All production statuses</option>
          {PRODUCTION_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
        <select name="payment" defaultValue={payment ?? ""} className="min-h-11 rounded-xl border border-brand-line px-3 py-2 text-sm">
          <option value="">All payment statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
        <button type="submit" className="min-h-11 rounded-xl bg-brand-pink px-5 text-sm font-semibold text-white hover:bg-brand-pink-deep">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-brand-line text-xs uppercase text-brand-navy-soft">
              <th className="px-5 py-3 text-start">Order #</th>
              <th className="px-5 py-3 text-start">Date</th>
              <th className="px-5 py-3 text-start">Customer</th>
              <th className="px-5 py-3 text-start">Phone</th>
              <th className="px-5 py-3 text-start">Items</th>
              <th className="px-5 py-3 text-start">Subtotal</th>
              <th className="px-5 py-3 text-start">Payment</th>
              <th className="px-5 py-3 text-start">Production</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-brand-navy-soft">
                  No orders match these filters.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-brand-line last:border-0 hover:bg-ivory-deep">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-pink-deep hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{order.createdAt.toLocaleDateString()}</td>
                  <td className="px-5 py-3">{order.customerName}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{order.phone}</td>
                  <td className="px-5 py-3">{order.items.length}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{formatCentsUSD(order.productsSubtotalCents, "en")}</td>
                  <td className="px-5 py-3"><StatusBadge status={order.paymentStatus} kind="payment" /></td>
                  <td className="px-5 py-3"><StatusBadge status={order.productionStatus} kind="production" /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
