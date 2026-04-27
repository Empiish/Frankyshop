import Image from "next/image";
import Link from "next/link";
import { sql } from "@/lib/db";
import type { Locale } from "@/i18n/config";

type Tile = {
  slug: string;
  name: string;
  image: string | null;
};

export async function CategoryCircles({ lang }: { lang: Locale }) {
  // For each category, pull the first product image we can find as the
  // tile photo. Keeps the row visually rich without the customer having
  // to upload a separate "category cover" asset.
  const rows = await sql<{
    slug: string;
    name_en: string;
    name_sw: string | null;
    name_hi: string | null;
    image: string | null;
  }[]>`
    select c.slug,
           c.name_en, c.name_sw, c.name_hi,
           (
             select pi.storage_path
             from products p
             join product_images pi on pi.product_id = p.id
             where p.category_id = c.id and p.is_active = true
             order by p.is_featured desc, pi.sort_order asc
             limit 1
           ) as image
    from categories c
    order by c.sort_order asc, c.name_en asc
  `;

  const tiles: Tile[] = rows.map((c) => ({
    slug: c.slug,
    name:
      (lang === "sw" && c.name_sw) ||
      (lang === "hi" && c.name_hi) ||
      c.name_en,
    image: c.image,
  }));

  if (tiles.length === 0) return null;

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <ul className="flex gap-7 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:justify-center md:gap-10">
          {tiles.map((t) => (
            <li key={t.slug} className="shrink-0">
              <Link
                href={`/${lang}/products?category=${t.slug}`}
                className="group flex w-[112px] flex-col items-center gap-3 text-center"
              >
                <div className="relative h-28 w-28 overflow-hidden rounded-full bg-surface-muted ring-2 ring-transparent transition-all duration-300 ease-out group-hover:ring-accent group-hover:ring-offset-2 group-hover:ring-offset-background">
                  {t.image ? (
                    <Image
                      src={t.image}
                      alt={t.name}
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 product-tile-gradient-1" />
                  )}
                </div>
                <span className="text-sm font-medium leading-tight text-foreground transition-colors group-hover:text-accent">
                  {t.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
