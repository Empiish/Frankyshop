import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { listCategories } from "@/lib/products";
import { requireStaff } from "@/lib/auth";

export default async function NewProductPage() {
  await requireStaff();
  const categories = await listCategories();
  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to products
      </Link>
      <h1 className="font-display mt-4 text-4xl tracking-tight">New product</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Fill in English first — Swahili and Hindi fall back to English if left empty.
      </p>
      <div className="mt-8">
        <ProductForm defaults={{ is_active: true, is_featured: false, price_tsh: 0, stock: 0 }} categories={categories} />
      </div>
    </div>
  );
}
