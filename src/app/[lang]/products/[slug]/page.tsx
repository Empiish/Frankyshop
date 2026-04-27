import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getProductBySlug,
  getRelatedProducts,
  localizedProductDescription,
  localizedProductName,
  localizedSellingTechniques,
} from "@/lib/products";
import { sql } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { AddToCartButton } from "@/components/AddToCartButton";
import { WishlistButton } from "@/components/WishlistButton";
import { formatTSh } from "@/lib/utils";
import { getCurrentCustomer } from "@/lib/customer-auth";

const tileGradients = [
  "product-tile-gradient-2",
  "product-tile-gradient-1",
  "product-tile-gradient-3",
  "product-tile-gradient-4",
];

export default async function ProductDetailPage({
  params,
}: PageProps<"/[lang]/products/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const name = localizedProductName(product, lang as Locale);
  const description = localizedProductDescription(product, lang as Locale);
  const techniques = localizedSellingTechniques(product, lang as Locale);
  const related = await getRelatedProducts(product.id, product.category_id);
  const images = await sql<{ storage_path: string; alt: string | null }[]>`
    select storage_path, alt from product_images
    where product_id = ${product.id} order by sort_order asc
  `;
  const heroImage = images[0]?.storage_path ?? null;
  const subImages = images.slice(1, 4);

  const customer = await getCurrentCustomer();
  let initialInWishlist = false;
  if (customer) {
    const w = await sql`
      select 1 from wishlist_items where customer_id = ${customer.customerId} and product_id = ${product.id} limit 1
    `;
    initialInWishlist = w.length > 0;
  }

  const wholesale = (product.wholesale_tiers ?? []) as { min_qty: number; price_tsh: number }[];

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-8 lg:px-10">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href={`/${lang}`} className="hover:text-accent">{dict.nav.home}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/${lang}/products`} className="hover:text-accent">{dict.nav.products}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{name}</span>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className={`relative aspect-square w-full overflow-hidden rounded-[2rem] ${heroImage ? "" : tileGradients[0]}`}>
              {heroImage && (
                <Image
                  src={heroImage}
                  alt={name}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                  priority
                  unoptimized
                />
              )}
              <span className="absolute left-5 top-5 rounded-full bg-background/80 px-3 py-1 text-[11px] font-medium tracking-wider text-muted-foreground backdrop-blur">
                {product.sku}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {(subImages.length > 0 ? subImages : [1, 2, 3].map(() => null)).map((img, i) => (
                <div
                  key={i}
                  className={`relative aspect-square overflow-hidden rounded-2xl ${img ? "" : tileGradients[(i + 1) % tileGradients.length]}`}
                >
                  {img && (
                    <Image
                      src={img.storage_path}
                      alt={img.alt ?? `${name} ${i + 2}`}
                      fill
                      sizes="20vw"
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 lg:pt-4">
            <p className="eyebrow">{product.sku}</p>
            <h1 className="font-display mt-3 text-4xl leading-tight tracking-tight sm:text-5xl">
              {name}
            </h1>
            <p className="mt-5 text-3xl font-medium tabular-nums">
              {dict.common.currency} {formatTSh(product.price_tsh)}
            </p>

            <div className="mt-3">
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {dict.product.in_stock.replace("{n}", String(product.stock))}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-danger">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                  {dict.product.out_of_stock}
                </span>
              )}
            </div>

            {description && (
              <p className="mt-7 text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <AddToCartButton
                  product={{
                    productId: product.id,
                    sku: product.sku,
                    slug: product.slug,
                    name,
                    unitPriceTsh: product.price_tsh,
                    stock: product.stock,
                  }}
                  labels={{
                    add: dict.product.add_to_cart,
                    added: dict.product.added,
                    out_of_stock: dict.product.out_of_stock,
                  }}
                />
              </div>
              <WishlistButton
                productId={product.id}
                initialInWishlist={initialInWishlist}
                isLoggedIn={Boolean(customer)}
                lang={lang}
                labels={{
                  saved: dict.product.wishlist_saved,
                  save: dict.product.wishlist_save,
                  sign_in_required: dict.product.wishlist_sign_in,
                }}
              />
            </div>

            {wholesale.length > 0 && (
              <div className="mt-10 rounded-2xl border border-border bg-surface-muted p-6">
                <p className="eyebrow">{dict.product.wholesale_eyebrow}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {dict.product.wholesale_subtitle}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {wholesale.map((t) => (
                    <li
                      key={t.min_qty}
                      className="flex items-center justify-between border-b border-border/60 py-2 last:border-0"
                    >
                      <span>
                        {dict.product.wholesale_tier.replace(
                          "{n}",
                          String(t.min_qty),
                        )}
                      </span>
                      <span className="font-medium tabular-nums">
                        {dict.common.currency} {formatTSh(t.price_tsh)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {techniques && (
              <div className="mt-10">
                <p className="eyebrow">{dict.product.notes_eyebrow}</p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {techniques}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border bg-surface-muted">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
            <p className="eyebrow">{dict.product.related_eyebrow}</p>
            <h2 className="font-display mt-3 text-3xl tracking-tight sm:text-4xl">
              {dict.product.related_title}
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-7">
              {related.map((p, i) => (
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
          </div>
        </section>
      )}
    </>
  );
}
