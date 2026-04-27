"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

const tierSchema = z.object({
  min_qty: z.number().int().positive(),
  price_tsh: z.number().int().nonnegative(),
});

const productSchema = z.object({
  sku: z.string().min(2).max(50),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens only"),
  category_id: z.string().uuid().nullable(),
  name_en: z.string().min(1).max(200),
  name_sw: z.string().max(200).optional().or(z.literal("")),
  name_hi: z.string().max(200).optional().or(z.literal("")),
  description_en: z.string().max(4000).optional().or(z.literal("")),
  description_sw: z.string().max(4000).optional().or(z.literal("")),
  description_hi: z.string().max(4000).optional().or(z.literal("")),
  selling_techniques_en: z.string().max(4000).optional().or(z.literal("")),
  selling_techniques_sw: z.string().max(4000).optional().or(z.literal("")),
  selling_techniques_hi: z.string().max(4000).optional().or(z.literal("")),
  price_tsh: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  wholesale_tiers: z.array(tierSchema).default([]),
  image_urls: z.array(z.string().url()).default([]),
});

export type ProductFormInput = z.input<typeof productSchema>;

function fdNum(fd: FormData, k: string): number {
  return Number(fd.get(k) ?? 0);
}
function fdStr(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function fdBool(fd: FormData, k: string): boolean {
  return fd.get(k) === "on" || fd.get(k) === "true";
}

function parseTiers(raw: string): { min_qty: number; price_tsh: number }[] {
  const lines = raw
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines
    .map((l) => {
      const m = l.match(/(\d+)\s*[:@]\s*(\d+)/);
      if (!m) return null;
      return { min_qty: parseInt(m[1], 10), price_tsh: parseInt(m[2], 10) };
    })
    .filter((t): t is { min_qty: number; price_tsh: number } => t !== null);
}

function parseImageUrls(raw: string): string[] {
  return raw
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//.test(s));
}

function fromForm(fd: FormData): unknown {
  return {
    sku: fdStr(fd, "sku"),
    slug: fdStr(fd, "slug"),
    category_id: fdStr(fd, "category_id") || null,
    name_en: fdStr(fd, "name_en"),
    name_sw: fdStr(fd, "name_sw"),
    name_hi: fdStr(fd, "name_hi"),
    description_en: fdStr(fd, "description_en"),
    description_sw: fdStr(fd, "description_sw"),
    description_hi: fdStr(fd, "description_hi"),
    selling_techniques_en: fdStr(fd, "selling_techniques_en"),
    selling_techniques_sw: fdStr(fd, "selling_techniques_sw"),
    selling_techniques_hi: fdStr(fd, "selling_techniques_hi"),
    price_tsh: fdNum(fd, "price_tsh"),
    stock: fdNum(fd, "stock"),
    is_active: fdBool(fd, "is_active"),
    is_featured: fdBool(fd, "is_featured"),
    wholesale_tiers: parseTiers(fdStr(fd, "wholesale_tiers")),
    image_urls: parseImageUrls(fdStr(fd, "image_urls")),
  };
}

async function audit(actorStaffId: string, role: "admin" | "staff", action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
  await sql`
    insert into audit_log (actor_staff_id, actor_role, action, entity_type, entity_id, before_data, after_data)
    values (${actorStaffId}, ${role}, ${action}, ${entityType}, ${entityId}, ${before as never}, ${after as never})
  `;
}

export async function createProduct(formData: FormData) {
  const session = await requireStaff();
  const parsed = productSchema.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid product" };
  }
  const v = parsed.data;
  const [{ id }] = await sql<{ id: string }[]>`
    insert into products (
      sku, slug, category_id,
      name_en, name_sw, name_hi,
      description_en, description_sw, description_hi,
      selling_techniques_en, selling_techniques_sw, selling_techniques_hi,
      price_tsh, stock, is_active, is_featured, wholesale_tiers
    ) values (
      ${v.sku}, ${v.slug}, ${v.category_id},
      ${v.name_en}, ${v.name_sw || null}, ${v.name_hi || null},
      ${v.description_en || null}, ${v.description_sw || null}, ${v.description_hi || null},
      ${v.selling_techniques_en || null}, ${v.selling_techniques_sw || null}, ${v.selling_techniques_hi || null},
      ${v.price_tsh}, ${v.stock}, ${v.is_active}, ${v.is_featured}, ${JSON.stringify(v.wholesale_tiers)}::jsonb
    )
    returning id
  `;
  for (let i = 0; i < v.image_urls.length; i++) {
    await sql`
      insert into product_images (product_id, storage_path, sort_order)
      values (${id}, ${v.image_urls[i]}, ${i})
    `;
  }
  await audit(session.staffId, session.role, "product.create", "product", id, null, v);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await requireStaff();
  const parsed = productSchema.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid product" };
  }
  const v = parsed.data;
  const [before] = await sql`select * from products where id = ${id}`;
  await sql`
    update products set
      sku = ${v.sku},
      slug = ${v.slug},
      category_id = ${v.category_id},
      name_en = ${v.name_en},
      name_sw = ${v.name_sw || null},
      name_hi = ${v.name_hi || null},
      description_en = ${v.description_en || null},
      description_sw = ${v.description_sw || null},
      description_hi = ${v.description_hi || null},
      selling_techniques_en = ${v.selling_techniques_en || null},
      selling_techniques_sw = ${v.selling_techniques_sw || null},
      selling_techniques_hi = ${v.selling_techniques_hi || null},
      price_tsh = ${v.price_tsh},
      stock = ${v.stock},
      is_active = ${v.is_active},
      is_featured = ${v.is_featured},
      wholesale_tiers = ${JSON.stringify(v.wholesale_tiers)}::jsonb,
      updated_at = now()
    where id = ${id}
  `;
  await sql`delete from product_images where product_id = ${id}`;
  for (let i = 0; i < v.image_urls.length; i++) {
    await sql`
      insert into product_images (product_id, storage_path, sort_order)
      values (${id}, ${v.image_urls[i]}, ${i})
    `;
  }
  await audit(session.staffId, session.role, "product.update", "product", id, before, v);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  const session = await requireStaff();
  const [before] = await sql`select * from products where id = ${id}`;
  await sql`delete from products where id = ${id}`;
  await audit(session.staffId, session.role, "product.delete", "product", id, before, null);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
