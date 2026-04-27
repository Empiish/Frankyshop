"use server";

import { z } from "zod";
import { sql } from "@/lib/db";

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
});

export type PlaceOrderInput = z.input<typeof placeOrderSchema>;

export type PlaceOrderResult =
  | { ok: true; orderCode: string }
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

  try {
    const [{ id: orderId }] = await sql<{ id: string }[]>`
      insert into orders (
        public_code, customer_name, customer_phone, customer_email,
        delivery_zone_id, delivery_address,
        subtotal_tsh, delivery_fee_tsh, total_tsh,
        status, payment_method, notes
      ) values (
        ${orderCode}, ${v.customerName}, ${v.customerPhone}, ${v.customerEmail || null},
        ${v.deliveryZoneId}, ${v.deliveryAddress},
        ${subtotal}, ${zone.fee_tsh}, ${total},
        'pending', ${v.paymentMethod}, ${v.notes || null}
      )
      returning id
    `;

    for (const it of v.items) {
      await sql`
        insert into order_items (order_id, product_id, sku, name, unit_price_tsh, quantity, line_total_tsh)
        values (${orderId}, ${it.productId}, ${it.sku}, ${it.name}, ${it.unitPriceTsh}, ${it.quantity}, ${it.unitPriceTsh * it.quantity})
      `;
    }

    return { ok: true, orderCode };
  } catch (err) {
    console.error("placeOrder failed", err);
    return { ok: false, error: "Could not place order. Please try again." };
  }
}
