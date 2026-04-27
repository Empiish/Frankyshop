import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { sql } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import { listCategories } from "@/lib/products";
import { requireStaff } from "@/lib/auth";

type Row = {
  id: string;
  sku: string;
  slug: string;
  category_id: string | null;
  name_en: string;
  name_sw: string | null;
  name_hi: string | null;
  description_en: string | null;
  description_sw: string | null;
  description_hi: string | null;
  selling_techniques_en: string | null;
  selling_techniques_sw: string | null;
  selling_techniques_hi: string | null;
  price_tsh: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  wholesale_tiers: { min_qty: number; price_tsh: number }[];
};

type Img = { storage_path: string };

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  await requireStaff();
  const { id } = await params;
  const rows = await sql<Row[]>`select * from products where id = ${id} limit 1`;
  const p = rows[0];
  if (!p) notFound();
  const images = await sql<Img[]>`
    select storage_path from product_images where product_id = ${id} order by sort_order asc
  `;
  const categories = await listCategories();

  const tiersText = (p.wholesale_tiers ?? [])
    .map((t) => `${t.min_qty}:${t.price_tsh}`)
    .join("\n");
  const imageText = images.map((i) => i.storage_path).join("\n");

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to products
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{p.sku}</p>
          <h1 className="font-display mt-2 text-4xl tracking-tight">{p.name_en}</h1>
        </div>
      </div>
      <div className="mt-8">
        <ProductForm
          defaults={{
            id: p.id,
            sku: p.sku,
            slug: p.slug,
            category_id: p.category_id,
            name_en: p.name_en,
            name_sw: p.name_sw ?? "",
            name_hi: p.name_hi ?? "",
            description_en: p.description_en ?? "",
            description_sw: p.description_sw ?? "",
            description_hi: p.description_hi ?? "",
            selling_techniques_en: p.selling_techniques_en ?? "",
            selling_techniques_sw: p.selling_techniques_sw ?? "",
            selling_techniques_hi: p.selling_techniques_hi ?? "",
            price_tsh: p.price_tsh,
            stock: p.stock,
            is_active: p.is_active,
            is_featured: p.is_featured,
            wholesale_tiers_text: tiersText,
            image_urls_text: imageText,
          }}
          categories={categories}
        />
      </div>
    </div>
  );
}
