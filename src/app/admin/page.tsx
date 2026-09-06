import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCentsUSD } from "@/lib/pricing";
import { StatCard, StatusBadge } from "@/components/admin/AdminUI";

export default async function AdminOverviewPage() {
  const [newCount, designingCount, waitingCount, readyCount, shippedCount, followUpCount, recentOrders] =
    await Promise.all([
      prisma.order.count({ where: { productionStatus: "new" } }),
      prisma.order.count({ where: { productionStatus: "designing" } }),
      prisma.order.count({ where: { productionStatus: "waiting_approval" } }),
      prisma.order.count({ where: { productionStatus: "ready" } }),
      prisma.order.count({ where: { productionStatus: "shipped" } }),
      prisma.order.count({ where: { paymentStatus: { in: ["pending", "pending_verification"] } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { items: true },
      }),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-brand-navy">Overview</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-pink-deep"
          >
            + Add Product
          </Link>
          <Link
            href="/admin/orders?production=new"
            className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-navy hover:border-brand-pink"
          >
            View New Orders
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="New Orders" value={newCount} href="/admin/orders?production=new" />
        <StatCard label="Designing" value={designingCount} href="/admin/orders?production=designing" />
        <StatCard label="Waiting Approval" value={waitingCount} href="/admin/orders?production=waiting_approval" />
        <StatCard label="Ready" value={readyCount} href="/admin/orders?production=ready" />
        <StatCard label="Shipped" value={shippedCount} href="/admin/orders?production=shipped" />
        <StatCard label="Payment Follow-up" value={followUpCount} href="/admin/orders?payment=pending" />
      </div>

      <div className="rounded-2xl border border-brand-line bg-white">
        <div className="flex items-center justify-between border-b border-brand-line p-5">
          <h2 className="font-bold text-brand-navy">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand-pink-deep hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-brand-line text-xs uppercase text-brand-navy-soft">
                <th className="px-5 py-3 text-start">Order #</th>
                <th className="px-5 py-3 text-start">Customer</th>
                <th className="px-5 py-3 text-start">Products</th>
                <th className="px-5 py-3 text-start">Subtotal</th>
                <th className="px-5 py-3 text-start">Payment</th>
                <th className="px-5 py-3 text-start">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-brand-navy-soft">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-brand-line last:border-0 hover:bg-ivory-deep">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-pink-deep hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{order.customerName}</td>
                    <td className="px-5 py-3">{order.items.length}</td>
                    <td className="px-5 py-3">{formatCentsUSD(order.productsSubtotalCents, "en")}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.paymentStatus} kind="payment" />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.productionStatus} kind="production" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
