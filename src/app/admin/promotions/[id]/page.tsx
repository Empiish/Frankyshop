import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { sql } from "@/lib/db";
import { listCategories } from "@/lib/products";
import { requireStaff } from "@/lib/auth";
import { PromotionForm } from "@/components/admin/PromotionForm";

type Row = {
  id: string;
  code: string | null;
  name_en: string;
  name_sw: string | null;
  name_hi: string | null;
  type: "percent_off" | "fixed_off" | "bogo";
  value: number;
  starts_at: string | null;
  ends_at: string | null;
  applies_to_category_id: string | null;
  applies_to_product_id: string | null;
  is_active: boolean;
};

function toDatetimeLocal(d: string | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export default async function EditPromotionPage({
  params,
}: PageProps<"/admin/promotions/[id]">) {
  await requireStaff();
  const { id } = await params;
  const rows = await sql<Row[]>`select * from promotions where id = ${id} limit 1`;
  const p = rows[0];
  if (!p) notFound();

  const [categories, products] = await Promise.all([
    listCategories(),
    sql<{ id: string; name_en: string; sku: string }[]>`
      select id, name_en, sku from products where is_active = true order by name_en asc
    `,
  ]);

  return (
    <div>
      <Link
        href="/admin/promotions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to promotions
      </Link>
      <h1 className="font-display mt-4 text-4xl tracking-tight">{p.name_en}</h1>
      <div className="mt-8">
        <PromotionForm
          defaults={{
            id: p.id,
            code: p.code ?? "",
            name_en: p.name_en,
            name_sw: p.name_sw ?? "",
            name_hi: p.name_hi ?? "",
            type: p.type,
            value: p.value,
            starts_at: toDatetimeLocal(p.starts_at),
            ends_at: toDatetimeLocal(p.ends_at),
            applies_to_category_id: p.applies_to_category_id,
            applies_to_product_id: p.applies_to_product_id,
            is_active: p.is_active,
          }}
          categories={categories}
          products={products}
        />
      </div>
    </div>
  );
}
