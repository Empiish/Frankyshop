import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ProductCard } from "@/components/ProductCard";
import { CatalogToolbar } from "@/components/CatalogToolbar";
import { CategoryCircles } from "@/components/CategoryCircles";
import { listCategories, listProducts } from "@/lib/products";

type SP = {
  q?: string;
  category?: string;
  sort?: "newest" | "price-asc" | "price-desc";
  in_stock?: string;
  page?: string;
};

export default async function ProductsPage({
  params,
  searchParams,
}: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const sp = ((await searchParams) ?? {}) as SP;

  const page = Math.max(1, Number(sp.page) || 1);
  const [categories, { rows, total, pageSize }] = await Promise.all([
    listCategories(),
    listProducts({
      q: sp.q,
      categorySlug: sp.category,
      sort: sp.sort,
      inStockOnly: sp.in_stock === "1",
      page,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <CategoryCircles lang={lang as Locale} />
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-16 lg:px-10 lg:pt-24">
        <p className="eyebrow">{dict.catalog.eyebrow}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            {sp.q
              ? dict.catalog.results_for.replace("{q}", sp.q)
              : dict.catalog.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dict.catalog.count.replace("{n}", String(total))}
          </p>
        </div>
      </section>

      <CatalogToolbar
        categories={categories}
        lang={lang as Locale}
        strings={{
          search_placeholder: dict.catalog.search_placeholder,
          all: dict.catalog.all,
          newest: dict.catalog.sort_newest,
          price_low: dict.catalog.sort_price_low,
          price_high: dict.catalog.sort_price_high,
          in_stock_only: dict.catalog.in_stock_only,
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-muted px-6 py-20 text-center">
            <p className="font-display text-2xl">{dict.catalog.empty_title}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {dict.catalog.empty_subtitle}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-7">
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

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            lang={lang as Locale}
            sp={sp}
            label={dict.catalog.page}
          />
        )}
      </section>
    </>
  );
}

function Pagination({
  page,
  totalPages,
  lang,
  sp,
  label,
}: {
  page: number;
  totalPages: number;
  lang: Locale;
  sp: SP;
  label: string;
}) {
  const buildUrl = (n: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set("q", sp.q);
    if (sp.category) u.set("category", sp.category);
    if (sp.sort) u.set("sort", sp.sort);
    if (sp.in_stock) u.set("in_stock", sp.in_stock);
    if (n > 1) u.set("page", String(n));
    const qs = u.toString();
    return `/${lang}/products${qs ? "?" + qs : ""}`;
  };

  return (
    <nav className="mt-12 flex items-center justify-center gap-1 text-sm">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={buildUrl(n)}
          className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 ${
            n === page
              ? "bg-foreground text-background"
              : "hover:bg-surface-muted"
          }`}
          aria-label={`${label} ${n}`}
          aria-current={n === page ? "page" : undefined}
        >
          {n}
        </Link>
      ))}
    </nav>
  );
}
