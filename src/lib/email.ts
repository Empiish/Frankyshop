import "server-only";
import { Resend } from "resend";

const BUSINESS_NAME = "FrankyShop";
const BUSINESS_ADDRESS = "Kariakoo, Dar es Salaam, Tanzania";
const BUSINESS_TIN = "000-000-000"; // placeholder — replace with real TIN before launch
const BUSINESS_PHONE = process.env.NEXT_PUBLIC_SHOP_PHONE ?? "+255 000 000 000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://frankyshop.vercel.app";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

function formatTSh(amount: number) {
  return amount.toLocaleString("en-TZ");
}

export type OrderEmailData = {
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryZoneName: string;
  deliveryFeeTsh: number;
  subtotalTsh: number;
  totalTsh: number;
  items: { name: string; sku: string; quantity: number; unitPriceTsh: number }[];
  createdAt: Date;
  isTest?: boolean;
};

function buildReceiptHtml(order: OrderEmailData): string {
  const itemRows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;">${it.name}<br><span style="color:#6b7280;font-size:12px;">${it.sku}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:center;">${it.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">TSh ${formatTSh(it.unitPriceTsh)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">TSh ${formatTSh(it.unitPriceTsh * it.quantity)}</td>
      </tr>`
    )
    .join("");

  const dateStr = order.createdAt.toLocaleString("en-TZ", {
    timeZone: "Africa/Dar_es_Salaam",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order Receipt — ${order.orderCode}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:ui-sans-serif,system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#1a1a1a;padding:28px 36px;">
    <table width="100%"><tr>
      <td><span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Franky<span style="color:#c2663a;">.</span></span></td>
      <td align="right"><span style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Order Receipt</span></td>
    </tr></table>
  </td></tr>

  <!-- Business info (Tanzania EFD requirement) -->
  <tr><td style="padding:20px 36px 0;border-bottom:2px solid #f3f4f6;">
    <table width="100%"><tr>
      <td style="font-size:12px;color:#6b7280;line-height:1.6;">
        <strong style="color:#374151;">${BUSINESS_NAME}</strong><br>
        ${BUSINESS_ADDRESS}<br>
        TIN: ${BUSINESS_TIN}<br>
        Tel: ${BUSINESS_PHONE}
      </td>
      <td align="right" style="font-size:12px;color:#6b7280;line-height:1.6;">
        <strong style="color:#374151;">Receipt No.</strong><br>
        ${order.orderCode}<br>
        ${dateStr}${order.isTest ? '<br><span style="color:#dc2626;font-weight:700;">⚠ TEST ORDER</span>' : ""}
      </td>
    </tr></table>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:28px 36px 12px;">
    <p style="margin:0 0 4px;font-size:20px;font-weight:600;color:#111827;">Thank you, ${order.customerName}.</p>
    <p style="margin:0;font-size:14px;color:#6b7280;">Your order is confirmed. We'll WhatsApp you to arrange delivery.</p>
  </td></tr>

  <!-- Customer details -->
  <tr><td style="padding:0 36px 24px;">
    <table width="100%" style="background:#f9fafb;border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:13px;color:#6b7280;line-height:1.8;">
        <strong style="color:#374151;">Deliver to:</strong><br>
        ${order.customerPhone}<br>
        ${order.deliveryAddress}
      </td></tr>
    </table>
  </td></tr>

  <!-- Items table -->
  <tr><td style="padding:0 36px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead><tr style="border-bottom:2px solid #111827;">
        <th style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;font-weight:600;padding-bottom:8px;text-align:left;">Item</th>
        <th style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;font-weight:600;padding-bottom:8px;text-align:center;">Qty</th>
        <th style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;font-weight:600;padding-bottom:8px;text-align:right;">Unit</th>
        <th style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;font-weight:600;padding-bottom:8px;text-align:right;">Total</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
  </td></tr>

  <!-- Totals -->
  <tr><td style="padding:16px 36px 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Subtotal</td><td align="right" style="font-size:13px;color:#374151;padding:4px 0;">TSh ${formatTSh(order.subtotalTsh)}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Delivery (${order.deliveryZoneName})</td><td align="right" style="font-size:13px;color:#374151;padding:4px 0;">TSh ${formatTSh(order.deliveryFeeTsh)}</td></tr>
      <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:8px;"></td></tr>
      <tr><td style="font-size:16px;font-weight:700;color:#111827;padding:4px 0;">Total</td><td align="right" style="font-size:18px;font-weight:700;color:#111827;padding:4px 0;">TSh ${formatTSh(order.totalTsh)}</td></tr>
    </table>
  </td></tr>

  <!-- VAT note (Tanzania compliance) -->
  <tr><td style="padding:12px 36px 0;">
    <p style="margin:0;font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:12px;">
      This receipt is issued by ${BUSINESS_NAME} (TIN: ${BUSINESS_TIN}). Prices include applicable taxes.
      This document serves as proof of purchase under Tanzanian law.
    </p>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:24px 36px;">
    <a href="${SITE_URL}/en/checkout/confirmation?code=${order.orderCode}"
       style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:100px;font-size:14px;font-weight:500;">
      View Order Status
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 36px;background:#f9fafb;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
      FrankyShop · Kariakoo, Dar es Salaam · Tanzania<br>
      Questions? WhatsApp us at ${BUSINESS_PHONE}
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendOrderConfirmation(order: OrderEmailData): Promise<void> {
  if (!order.customerEmail) return;

  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL ?? "orders@frankyshop.com";

  await resend.emails.send({
    from: `FrankyShop <${from}>`,
    to: order.customerEmail,
    subject: `Your order ${order.orderCode} is confirmed — FrankyShop`,
    html: buildReceiptHtml(order),
  });
}
