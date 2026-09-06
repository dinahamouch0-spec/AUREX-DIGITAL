import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCentsUSD } from "@/lib/pricing";
import { AdminCard, StatusBadge } from "@/components/admin/AdminUI";
import { OrderStatusPanel } from "@/components/admin/OrderStatusPanel";
import { OrderItemPhoto } from "@/components/admin/OrderItemPhoto";
import { WhatsAppActions } from "@/components/admin/WhatsAppActions";
import { getWhatsappTemplate } from "@/lib/whatsapp-templates";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { answers: true, upload: true } },
      timeline: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  const [confirmationTpl, designReadyTpl, readyShippingTpl] = await Promise.all([
    getWhatsappTemplate("order_confirmation", order.locale),
    getWhatsappTemplate("design_ready", order.locale),
    getWhatsappTemplate("ready_shipping", order.locale),
  ]);

  const templateVars = { name: order.customerName, orderNumber: order.orderNumber };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm font-semibold text-brand-navy-soft hover:text-brand-pink-deep">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">{order.orderNumber}</h1>
          <p className="text-sm text-brand-navy-soft">
            {order.createdAt.toLocaleString()} · {order.locale.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.paymentStatus} kind="payment" />
          <StatusBadge status={order.productionStatus} kind="production" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AdminCard title="Customer">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-brand-navy-soft">Full Name</dt>
                <dd className="font-semibold text-brand-navy">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-brand-navy-soft">Phone / WhatsApp</dt>
                <dd className="font-semibold text-brand-navy">{order.phone}</dd>
              </div>
              {order.email && (
                <div>
                  <dt className="text-brand-navy-soft">Email</dt>
                  <dd className="font-semibold text-brand-navy">{order.email}</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="flex items-center gap-1 text-brand-navy-soft">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Delivery
                </dt>
                <dd className="font-semibold text-brand-navy">
                  {order.address}, {order.city}, {order.country}
                </dd>
                {order.addressNotes && (
                  <dd className="text-xs text-brand-navy-soft">{order.addressNotes}</dd>
                )}
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="Order Items">
            <div className="flex flex-col gap-4">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-brand-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-brand-navy">{item.productNameSnapshot}</p>
                      <p className="text-xs text-brand-navy-soft">Qty {item.quantity}</p>
                    </div>
                    <p className="font-bold text-brand-pink-deep">
                      {formatCentsUSD(item.lineTotalCents, "en")}
                    </p>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    {item.answers.map((a) => (
                      <div key={a.id}>
                        <dt className="text-brand-navy-soft">{a.labelSnapshot}</dt>
                        <dd className="font-medium text-brand-navy">
                          {a.optionLabelSnapshot ?? a.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-3 border-t border-brand-line pt-3">
                    <OrderItemPhoto
                      orderItemId={item.id}
                      status={item.upload?.status === "attached" || item.upload?.status === "deleted" ? item.upload.status : null}
                      deleteAfter={item.upload?.deleteAfter?.toISOString() ?? null}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="Timeline">
            <ul className="flex flex-col gap-2 text-xs">
              {order.timeline.length === 0 && <li className="text-brand-navy-soft">No events yet.</li>}
              {order.timeline.map((entry) => (
                <li key={entry.id} className="flex justify-between gap-3 border-b border-brand-line pb-2 last:border-0">
                  <span className="text-brand-navy">{entry.event.replaceAll("_", " ").replaceAll(":", ": ")}</span>
                  <span className="shrink-0 text-brand-navy-soft">{entry.createdAt.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </AdminCard>
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard title="Status">
            <OrderStatusPanel
              orderId={order.id}
              productionStatus={order.productionStatus}
              paymentStatus={order.paymentStatus}
              shippingCostCents={order.shippingCostCents}
              productsSubtotalCents={order.productsSubtotalCents}
            />
          </AdminCard>

          <AdminCard title="Payment">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-brand-navy-soft">Method</dt>
                <dd className="font-semibold capitalize text-brand-navy">{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-navy-soft">Products Subtotal</dt>
                <dd className="font-semibold text-brand-navy">
                  {formatCentsUSD(order.productsSubtotalCents, "en")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-navy-soft">Shipping</dt>
                <dd className="font-semibold text-brand-navy">
                  {order.shippingCostCents !== null
                    ? formatCentsUSD(order.shippingCostCents, "en")
                    : "To be confirmed"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-brand-line pt-2">
                <dt className="font-bold text-brand-navy">Final Total</dt>
                <dd className="font-bold text-brand-pink-deep">
                  {order.finalTotalCents !== null
                    ? formatCentsUSD(order.finalTotalCents, "en")
                    : "Pending"}
                </dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="WhatsApp">
            <WhatsAppActions
              phone={order.phone}
              templates={[
                { key: "order_confirmation", label: "Order Confirmation", body: confirmationTpl },
                { key: "design_ready", label: "Design Ready", body: designReadyTpl },
                { key: "ready_shipping", label: "Ready / Shipping", body: readyShippingTpl },
              ]}
              vars={templateVars}
            />
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
