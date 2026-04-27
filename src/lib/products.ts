import "server-only";
import { sql } from "@/lib/db";
import type { ProductRow, CategoryRow } from "@/lib/products-shared";

export type {
  ProductRow,
  CategoryRow,
} from "@/lib/products-shared";
export {
  localizedProductName,
  localizedProductDescription,
  localizedSellingTechniques,
  localizedCategoryName,
} from "@/lib/products-shared";

export type ProductFilters = {
  q?: string;
  categorySlug?: string;
  inStockOnly?: boolean;
  sort?: "newest" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
};

export async function listCategories(): Promise<CategoryRow[]> {
  return await sql<CategoryRow[]>`
    select id, slug, name_en, name_sw, name_hi
    from categories
    order by sort_order asc, name_en asc
  `;
}

export async function listProducts(filters: ProductFilters = {}) {
  const {
    q,
    categorySlug,
    inStockOnly = false,
    sort = "newest",
    page = 1,
    pageSize = 24,
  } = filters;
  const offset = (page - 1) * pageSize;

  const orderBy =
    sort === "price-asc"
      ? sql`p.price_tsh asc`
      : sort === "price-desc"
        ? sql`p.price_tsh desc`
        : sql`p.created_at desc`;

  const stockClause = inStockOnly ? sql`and p.stock > 0` : sql``;
  const categoryClause = categorySlug
    ? sql`and c.slug = ${categorySlug}`
    : sql``;
  const searchClause = q
    ? sql`and (p.name_en ilike ${"%" + q + "%"} or coalesce(p.name_sw,'') ilike ${"%" + q + "%"} or coalesce(p.name_hi,'') ilike ${"%" + q + "%"} or p.sku ilike ${"%" + q + "%"})`
    : sql``;

  const rows = await sql<ProductRow[]>`
    select p.id, p.sku, p.slug, p.category_id, c.slug as category_slug,
           p.name_en, p.name_sw, p.name_hi,
           p.description_en, p.description_sw, p.description_hi,
           p.selling_techniques_en, p.selling_techniques_sw, p.selling_techniques_hi,
           p.price_tsh, p.stock, p.is_featured, p.wholesale_tiers,
           (select storage_path from product_images where product_id = p.id order by sort_order asc limit 1) as primary_image_url
    from products p
    left join categories c on c.id = p.category_id
    where p.is_active = true
    ${categoryClause}
    ${searchClause}
    ${stockClause}
    order by ${orderBy}
    limit ${pageSize} offset ${offset}
  `;

  const [{ total }] = await sql<{ total: number }[]>`
    select count(*)::int as total
    from products p
    left join categories c on c.id = p.category_id
    where p.is_active = true
    ${categoryClause}
    ${searchClause}
    ${stockClause}
  `;

  return { rows, total, page, pageSize };
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const rows = await sql<ProductRow[]>`
    select p.id, p.sku, p.slug, p.category_id, c.slug as category_slug,
           p.name_en, p.name_sw, p.name_hi,
           p.description_en, p.description_sw, p.description_hi,
           p.selling_techniques_en, p.selling_techniques_sw, p.selling_techniques_hi,
           p.price_tsh, p.stock, p.is_featured, p.wholesale_tiers,
           (select storage_path from product_images where product_id = p.id order by sort_order asc limit 1) as primary_image_url
    from products p
    left join categories c on c.id = p.category_id
    where p.slug = ${slug} and p.is_active = true
    limit 1
  `;
  return rows[0] ?? null;
}

export async function getRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
  if (!categoryId) return [];
  return await sql<ProductRow[]>`
    select p.id, p.sku, p.slug, p.category_id, c.slug as category_slug,
           p.name_en, p.name_sw, p.name_hi,
           p.description_en, p.description_sw, p.description_hi,
           p.selling_techniques_en, p.selling_techniques_sw, p.selling_techniques_hi,
           p.price_tsh, p.stock, p.is_featured, p.wholesale_tiers,
           (select storage_path from product_images where product_id = p.id order by sort_order asc limit 1) as primary_image_url
    from products p
    left join categories c on c.id = p.category_id
    where p.is_active = true and p.category_id = ${categoryId} and p.id != ${productId}
    order by p.is_featured desc, p.created_at desc
    limit ${limit}
  `;
}
