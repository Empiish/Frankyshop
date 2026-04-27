"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

const STATUSES = ["pending", "paid", "failed", "refunded", "shipped", "delivered", "cancelled"] as const;

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUSES),
  payment_ref: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export async function updateOrderStatus(formData: FormData) {
  const session = await requireStaff();
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    payment_ref: formData.get("payment_ref")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const [before] = await sql<{ status: string; customer_id: string | null; total_tsh: number; paid_at: string | null }[]>`
    select status, customer_id, total_tsh, paid_at from orders where id = ${v.id}
  `;
  await sql`
    update orders set
      status = ${v.status},
      payment_ref = coalesce(${v.payment_ref ?? null}, payment_ref),
      notes = coalesce(${v.notes ?? null}, notes),
      paid_at = case when ${v.status} = 'paid' and paid_at is null then now() else paid_at end,
      updated_at = now()
    where id = ${v.id}
  `;
  // Award loyalty points the first time an order transitions to paid.
  if (v.status === "paid" && before && before.status !== "paid" && before.customer_id) {
    const points = Math.floor(before.total_tsh / 1000);
    if (points > 0) {
      await sql`
        update customers
        set loyalty_points = loyalty_points + ${points}
        where id = ${before.customer_id}
      `;
    }
  }
  await sql`
    insert into audit_log (actor_staff_id, actor_role, action, entity_type, entity_id, before_data, after_data)
    values (${session.staffId}, ${session.role}, 'order.status_change', 'order', ${v.id}, ${before as never}, ${v as never})
  `;
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${v.id}`);
  return { ok: true as const };
}
