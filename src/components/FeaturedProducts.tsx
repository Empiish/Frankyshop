import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { sql } from "@/lib/db";
import { formatTSh } from "@/lib/utils";

type FeaturedRow = {
  id: string;
  slug: string;
  sku: string;
  name_en: string;
  name_sw: string | null;
  name_hi: string | null;
  price_tsh: number;
  primary_image_url: string | null;
};

const localeNameField: Record<Locale, keyof FeaturedRow> = {
  en: "name_en",
  sw: "name_sw",
  hi: "name_hi",
};

const tileGradients = [
  "product-tile-gradient-1",
  "product-tile-gradient-2",
  "product-tile-gradient-3",
  "product-tile-gradient-4",
];

export async function FeaturedProducts({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary;
}) {
  let products: FeaturedRow[] = [];
  try {
    products = await sql<FeaturedRow[]>`
      select id, slug, sku, name_en, name_sw, name_hi, price_tsh,
             (select storage_path from product_images where product_id = products.id order by sort_order asc limit 1) as primary_image_url
      from products
      where is_active = true and is_featured = true
      order by created_at desc
      limit 4
    `;
  } catch {
    products = [];
  }

  if (products.length === 0) return null;

  return (
    <section className="border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{dict.sections.featured_eyebrow}</p>
            <h2 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">
              {dict.sections.featured_title}
            </h2>
          </div>
          <Link
            href={`/${lang}/products`}
            className="group hidden items-center gap-1.5 text-sm font-medium md:inline-flex"
          >
            <span className="border-b border-foreground pb-0.5 transition-colors group-hover:border-accent group-hover:text-accent">
              {dict.sections.see_all}
            </span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-7">
          {products.map((p, idx) => {
            const nameField = localeNameField[lang];
            const name = (p[nameField] as string | null) ?? p.name_en;
            return (
              <Link
                key={p.id}
                href={`/${lang}/products/${p.slug}`}
                className="group block"
              >
                <div
                  className={`relative aspect-[4/5] overflow-hidden rounded-2xl ${
                    p.primary_image_url ? "" : tileGradients[idx % tileGradients.length]
                  }`}
                >
                  {p.primary_image_url ? (
                    <Image
                      src={p.primary_image_url}
                      alt={name}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-medium tracking-wider text-muted-foreground backdrop-blur">
                    {p.sku}
                  </span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <h3 className="text-base font-medium leading-tight transition-colors group-hover:text-accent">
                    {name}
                  </h3>
                  <p className="whitespace-nowrap text-base font-medium tabular-nums">
                    {dict.common.currency} {formatTSh(p.price_tsh)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
