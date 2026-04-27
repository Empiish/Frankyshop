"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { invalidateSiteContent, SITE_KEYS } from "@/lib/site-content";

const schema = z.object({
  whatsapp_number: z.string().regex(/^\d{9,15}$/, "Digits only, no + or spaces (e.g. 255712345678)"),
  shop_phone: z.string().min(7).max(40),
  shop_lat: z.string().regex(/^-?\d+(\.\d+)?$/, "Decimal degrees, e.g. -6.8161"),
  shop_lng: z.string().regex(/^-?\d+(\.\d+)?$/, "Decimal degrees, e.g. 39.2706"),
  shop_address_en: z.string().min(1).max(300),
  shop_address_sw: z.string().max(300).optional().or(z.literal("")),
  shop_address_hi: z.string().max(300).optional().or(z.literal("")),
  shop_hours_en: z.string().min(1).max(200),
  shop_hours_sw: z.string().max(200).optional().or(z.literal("")),
  shop_hours_hi: z.string().max(200).optional().or(z.literal("")),
});

function fd(formData: FormData, k: string): string {
  return String(formData.get(k) ?? "").trim();
}

export async function saveSiteContent(formData: FormData) {
  const session = await requireStaff();
  const parsed = schema.safeParse({
    whatsapp_number: fd(formData, "whatsapp_number"),
    shop_phone: fd(formData, "shop_phone"),
    shop_lat: fd(formData, "shop_lat"),
    shop_lng: fd(formData, "shop_lng"),
    shop_address_en: fd(formData, "shop_address_en"),
    shop_address_sw: fd(formData, "shop_address_sw"),
    shop_address_hi: fd(formData, "shop_address_hi"),
    shop_hours_en: fd(formData, "shop_hours_en"),
    shop_hours_sw: fd(formData, "shop_hours_sw"),
    shop_hours_hi: fd(formData, "shop_hours_hi"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const updates: { key: string; en: string; sw?: string; hi?: string }[] = [
    { key: "whatsapp_number", en: v.whatsapp_number },
    { key: "shop_phone", en: v.shop_phone },
    { key: "shop_lat", en: v.shop_lat },
    { key: "shop_lng", en: v.shop_lng },
    { key: "shop_address", en: v.shop_address_en, sw: v.shop_address_sw, hi: v.shop_address_hi },
    { key: "shop_hours", en: v.shop_hours_en, sw: v.shop_hours_sw, hi: v.shop_hours_hi },
  ];

  for (const u of updates) {
    await sql`
      insert into site_content (key, value_en, value_sw, value_hi, updated_by, updated_at)
      values (${u.key}, ${u.en}, ${u.sw || null}, ${u.hi || null}, ${session.staffId}, now())
      on conflict (key) do update set
        value_en = excluded.value_en,
        value_sw = coalesce(excluded.value_sw, site_content.value_sw),
        value_hi = coalesce(excluded.value_hi, site_content.value_hi),
        updated_by = excluded.updated_by,
        updated_at = now()
    `;
  }

  await sql`
    insert into audit_log (actor_staff_id, actor_role, action, entity_type, entity_id, after_data)
    values (${session.staffId}, ${session.role}, 'site_content.update', 'site_content', 'all', ${v as never})
  `;

  invalidateSiteContent();
  revalidatePath("/admin/content");
  revalidatePath("/en/contact");
  revalidatePath("/sw/contact");
  revalidatePath("/hi/contact");
  return { ok: true as const };
}

export { SITE_KEYS };
