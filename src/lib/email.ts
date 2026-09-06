import "server-only";
import { Resend } from "resend";

/**
 * Order creation is the source of truth; email is a best-effort side
 * effect. Every function here swallows its own errors so a Resend outage
 * can never fail — or roll back — an already-created order.
 */

function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  productSummaries: string[];
  paymentMethod: string;
  subtotalFormatted: string;
  dashboardUrl?: string;
}

export async function sendAdminNewOrderEmail(
  to: string,
  data: OrderEmailData
): Promise<void> {
  const resend = client();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping admin notification");
    return;
  }
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Ya 7kayti <orders@ya7kayti.com>",
      to,
      subject: `New order ${data.orderNumber} — Ya 7kayti`,
      html: `
        <div style="font-family:sans-serif;line-height:1.6">
          <h2>New order received: ${data.orderNumber}</h2>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Products:</strong></p>
          <ul>${data.productSummaries.map((p) => `<li>${p}</li>`).join("")}</ul>
          <p><strong>Payment method:</strong> ${data.paymentMethod}</p>
          <p><strong>Products subtotal:</strong> ${data.subtotalFormatted}</p>
          ${data.dashboardUrl ? `<p><a href="${data.dashboardUrl}">Open in Dashboard</a></p>` : ""}
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] failed to send admin new-order email", err);
  }
}

interface CustomerEmailData {
  orderNumber: string;
  productSummaries: string[];
  subtotalFormatted: string;
  paymentMethod: string;
  locale: "ar" | "en";
}

export async function sendCustomerOrderConfirmationEmail(
  to: string,
  data: CustomerEmailData
): Promise<void> {
  const resend = client();
  if (!resend) return;
  const isAr = data.locale === "ar";
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Ya 7kayti <orders@ya7kayti.com>",
      to,
      subject: isAr
        ? `تم استلام طلبك ${data.orderNumber} ✨`
        : `We received your order ${data.orderNumber} ✨`,
      html: `
        <div dir="${isAr ? "rtl" : "ltr"}" style="font-family:sans-serif;line-height:1.6">
          <h2>${isAr ? "تم استلام طلبك ✨" : "Order received ✨"}</h2>
          <p>${isAr ? "رقم الطلب" : "Order number"}: <strong>${data.orderNumber}</strong></p>
          <ul>${data.productSummaries.map((p) => `<li>${p}</li>`).join("")}</ul>
          <p>${isAr ? "المجموع الفرعي" : "Subtotal"}: ${data.subtotalFormatted}</p>
          <p>${isAr ? "الشحن: سيتم تأكيده لاحقًا" : "Shipping: to be confirmed"}</p>
          <p>${isAr ? "طريقة الدفع" : "Payment method"}: ${data.paymentMethod}</p>
          <p>${isAr ? "سنتواصل معك قريبًا لتأكيد التفاصيل." : "We will contact you shortly to confirm the details."}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] failed to send customer confirmation email", err);
  }
}
