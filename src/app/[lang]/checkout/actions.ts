"use server";

import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getPaymentProvider } from "@/lib/payments";
import { sendOrderConfirmation } from "@/lib/email";

const itemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  unitPriceTsh: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
});

const placeOrderSchema = z.object({
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().min(7).max(20),
  customerEmail: z.string().email().optional().or(z.literal("")),
  deliveryZoneId: z.string().uuid(),
  deliveryAddress: z.string().min(1).max(500),
  notes: z.string().max(500).optional().or(z.literal("")),
  paymentMethod: z.enum(["mpesa", "card_placeholder"]),
  items: z.array(itemSchema).min(1),
  testMode: z.boolean().optional(),
});

export type PlaceOrderInput = z.input<typeof placeOrderSchema>;

export type PlaceOrderResult =
  | { ok: true; orderCode: string; emailError?: string }
  | { ok: false; error: string };

function generateOrderCode(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rnd = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `FK-${ts}${rnd}`;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const [zone] = await sql<{ fee_tsh: number }[]>`
    select fee_tsh from delivery_zones where id = ${v.deliveryZoneId} and is_active = true limit 1
  `;
  if (!zone) return { ok: false, error: "Invalid delivery zone" };

  const subtotal = v.items.reduce((s, i) => s + i.unitPriceTsh * i.quantity, 0);
  const total = subtotal + zone.fee_tsh;
  const orderCode = generateOrderCode();
  const customer = await getCurrentCustomer();

  try {
    const initialStatus = v.testMode ? "paid" : "pending";

    const [{ id: orderId }] = await sql<{ id: string }[]>`
      insert into orders (
        public_code, customer_id, customer_name, customer_phone, customer_email,
        delivery_zone_id, delivery_address,
        subtotal_tsh, delivery_fee_tsh, total_tsh,
        status, payment_method, notes
      ) values (
        ${orderCode}, ${customer?.customerId ?? null},
        ${v.customerName}, ${v.customerPhone}, ${v.customerEmail || null},
        ${v.deliveryZoneId}, ${v.deliveryAddress},
        ${subtotal}, ${zone.fee_tsh}, ${total},
        ${initialStatus}, ${v.paymentMethod}, ${v.notes || null}
      )
      returning id
    `;

    for (const it of v.items) {
      await sql`
        insert into order_items (order_id, product_id, sku, name, unit_price_tsh, quantity, line_total_tsh)
        values (${orderId}, ${it.productId}, ${it.sku}, ${it.name}, ${it.unitPriceTsh}, ${it.quantity}, ${it.unitPriceTsh * it.quantity})
      `;
    }

    // Get zone name for receipt
    const [zoneRow] = await sql<{ name_en: string }[]>`
      select name_en from delivery_zones where id = ${v.deliveryZoneId} limit 1
    `;

    // Send confirmation email
    let emailError: string | undefined;
    if (v.customerEmail) {
      try {
        await sendOrderConfirmation({
          orderCode,
          customerName: v.customerName,
          customerEmail: v.customerEmail,
          customerPhone: v.customerPhone,
          deliveryAddress: v.deliveryAddress,
          deliveryZoneName: zoneRow?.name_en ?? "Dar es Salaam",
          deliveryFeeTsh: zone.fee_tsh,
          subtotalTsh: subtotal,
          totalTsh: total,
          items: v.items,
          createdAt: new Date(),
          isTest: v.testMode,
        });
      } catch (err: any) {
        emailError = err?.message ?? JSON.stringify(err);
        console.error("[email] confirmation failed", emailError);
      }
    }

    // Kick off payment — skip for test orders
    if (v.paymentMethod === "mpesa" && !v.testMode) {
      const provider = getPaymentProvider();
      provider
        .initiate({
          orderId,
          orderCode,
          amountTsh: total,
          customerPhone: v.customerPhone,
          customerName: v.customerName,
        })
        .catch((err) => {
          console.error("[payments] initiate failed", err);
        });
    }

    return { ok: true, orderCode, emailError };
  } catch (err) {
    console.error("placeOrder failed", err);
    return { ok: false, error: "Could not place order. Please try again." };
  }
}
