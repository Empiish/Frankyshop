import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Tile = {
  slug: string;
  label: string;
  caption: string;
  gradient: string;
};

export function CategoryShowcase({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary;
}) {
  const tiles: Tile[] = [
    {
      slug: "thermos",
      label: dict.categories.thermos,
      caption: dict.categories.thermos_caption,
      gradient: "product-tile-gradient-2",
    },
    {
      slug: "cutlery",
      label: dict.categories.cutlery,
      caption: dict.categories.cutlery_caption,
      gradient: "product-tile-gradient-1",
    },
    {
      slug: "dishes",
      label: dict.categories.dishes,
      caption: dict.categories.dishes_caption,
      gradient: "product-tile-gradient-3",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="mb-12 flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{dict.sections.shop_by_category_eyebrow}</p>
          <h2 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">
            {dict.sections.shop_by_category_title}
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

      <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
        {/* Tall left tile */}
        <Tile tile={tiles[0]} lang={lang} className="lg:row-span-2 lg:h-full" tall />
        <Tile tile={tiles[1]} lang={lang} className="lg:col-start-2 lg:col-span-2" />
        <Tile tile={tiles[2]} lang={lang} className="lg:col-start-2 lg:col-span-2" />
      </div>
    </section>
  );
}

function Tile({
  tile,
  lang,
  className = "",
  tall = false,
}: {
  tile: Tile;
  lang: Locale;
  className?: string;
  tall?: boolean;
}) {
  return (
    <Link
      href={`/${lang}/products?category=${tile.slug}`}
      className={`group relative flex overflow-hidden rounded-[2rem] ${tile.gradient} ${
        tall ? "min-h-[420px]" : "min-h-[260px]"
      } ${className}`}
    >
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
      <div className="relative z-10 flex w-full flex-col justify-end p-7 lg:p-9">
        <p className="eyebrow text-foreground/60">{tile.caption}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h3 className="font-display text-3xl leading-tight sm:text-4xl">
            {tile.label}
          </h3>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition-colors group-hover:bg-accent">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
