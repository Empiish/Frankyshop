import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { sql } from "@/lib/db";
import { listCategories } from "@/lib/products";
import { requireStaff } from "@/lib/auth";
import { PromotionForm } from "@/components/admin/PromotionForm";

export default async function NewPromotionPage() {
  await requireStaff();
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
      <h1 className="font-display mt-4 text-4xl tracking-tight">New promotion</h1>
      <div className="mt-8">
        <PromotionForm
          defaults={{ is_active: true, type: "percent_off", value: 10 }}
          categories={categories}
          products={products}
        />
      </div>
    </div>
  );
}
