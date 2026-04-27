"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

const schema = z.object({
  code: z.string().max(60).optional().or(z.literal("")),
  name_en: z.string().min(1).max(200),
  name_sw: z.string().max(200).optional().or(z.literal("")),
  name_hi: z.string().max(200).optional().or(z.literal("")),
  type: z.enum(["percent_off", "fixed_off", "bogo"]),
  value: z.number().int().nonnegative(),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
  applies_to_category_id: z.string().uuid().nullable().optional(),
  applies_to_product_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean(),
});

function fdStr(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function fdNum(fd: FormData, k: string): number {
  return Number(fd.get(k) ?? 0);
}
function fromForm(fd: FormData): unknown {
  return {
    code: fdStr(fd, "code"),
    name_en: fdStr(fd, "name_en"),
    name_sw: fdStr(fd, "name_sw"),
    name_hi: fdStr(fd, "name_hi"),
    type: fdStr(fd, "type"),
    value: fdNum(fd, "value"),
    starts_at: fdStr(fd, "starts_at"),
    ends_at: fdStr(fd, "ends_at"),
    applies_to_category_id: fdStr(fd, "applies_to_category_id") || null,
    applies_to_product_id: fdStr(fd, "applies_to_product_id") || null,
    is_active: fd.get("is_active") === "on",
  };
}

export async function createPromotion(formData: FormData) {
  const session = await requireStaff();
  const parsed = schema.safeParse(fromForm(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const v = parsed.data;
  const [{ id }] = await sql<{ id: string }[]>`
    insert into promotions (
      code, name_en, name_sw, name_hi, type, value,
      starts_at, ends_at, applies_to_category_id, applies_to_product_id, is_active
    ) values (
      ${v.code || null}, ${v.name_en}, ${v.name_sw || null}, ${v.name_hi || null},
      ${v.type}, ${v.value},
      ${v.starts_at ? new Date(v.starts_at) : null},
      ${v.ends_at ? new Date(v.ends_at) : null},
      ${v.applies_to_category_id ?? null},
      ${v.applies_to_product_id ?? null},
      ${v.is_active}
    )
    returning id
  `;
  await sql`
    insert into audit_log (actor_staff_id, actor_role, action, entity_type, entity_id, after_data)
    values (${session.staffId}, ${session.role}, 'promotion.create', 'promotion', ${id}, ${v as never})
  `;
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function updatePromotion(id: string, formData: FormData) {
  const session = await requireStaff();
  const parsed = schema.safeParse(fromForm(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const v = parsed.data;
  const [before] = await sql`select * from promotions where id = ${id}`;
  await sql`
    update promotions set
      code = ${v.code || null},
      name_en = ${v.name_en},
      name_sw = ${v.name_sw || null},
      name_hi = ${v.name_hi || null},
      type = ${v.type},
      value = ${v.value},
      starts_at = ${v.starts_at ? new Date(v.starts_at) : null},
      ends_at = ${v.ends_at ? new Date(v.ends_at) : null},
      applies_to_category_id = ${v.applies_to_category_id ?? null},
      applies_to_product_id = ${v.applies_to_product_id ?? null},
      is_active = ${v.is_active}
    where id = ${id}
  `;
  await sql`
    insert into audit_log (actor_staff_id, actor_role, action, entity_type, entity_id, before_data, after_data)
    values (${session.staffId}, ${session.role}, 'promotion.update', 'promotion', ${id}, ${before as never}, ${v as never})
  `;
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function deletePromotion(id: string) {
  const session = await requireStaff();
  const [before] = await sql`select * from promotions where id = ${id}`;
  await sql`delete from promotions where id = ${id}`;
  await sql`
    insert into audit_log (actor_staff_id, actor_role, action, entity_type, entity_id, before_data)
    values (${session.staffId}, ${session.role}, 'promotion.delete', 'promotion', ${id}, ${before as never})
  `;
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}
