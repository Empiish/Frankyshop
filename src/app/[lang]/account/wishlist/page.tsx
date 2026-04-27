import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { ProductCard } from "@/components/ProductCard";
import type { ProductRow } from "@/lib/products-shared";

export default async function WishlistPage({ params }: PageProps<"/[lang]/account/wishlist">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const session = await requireCustomer(lang);

  const rows = await sql<ProductRow[]>`
    select p.id, p.sku, p.slug, p.category_id, c.slug as category_slug,
           p.name_en, p.name_sw, p.name_hi,
           p.description_en, p.description_sw, p.description_hi,
           p.selling_techniques_en, p.selling_techniques_sw, p.selling_techniques_hi,
           p.price_tsh, p.stock, p.is_featured, p.wholesale_tiers,
           (select storage_path from product_images where product_id = p.id order by sort_order asc limit 1) as primary_image_url
    from wishlist_items w
    join products p on p.id = w.product_id
    left join categories c on c.id = p.category_id
    where w.customer_id = ${session.customerId} and p.is_active = true
    order by w.created_at desc
  `;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
      <Link href={`/${lang}/account`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        {dict.account.back_to_account}
      </Link>
      <p className="eyebrow mt-6">{dict.account.eyebrow}</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">{dict.account.wishlist}</h1>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
          <p className="font-display text-2xl">{dict.account.wishlist_empty}</p>
          <Link href={`/${lang}/products`} className="mt-4 inline-flex text-sm text-accent hover:underline">
            {dict.account.browse}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-7">
          {rows.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              lang={lang as Locale}
              index={i}
              currencyLabel={dict.common.currency}
              imageUrl={p.primary_image_url}
            />
          ))}
        </div>
      )}
    </section>
  );
}
