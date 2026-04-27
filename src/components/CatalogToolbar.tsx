"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import type { CategoryRow } from "@/lib/products-shared";
import type { Locale } from "@/i18n/config";
import { localizedCategoryName } from "@/lib/products-shared";

type Strings = {
  search_placeholder: string;
  all: string;
  newest: string;
  price_low: string;
  price_high: string;
  in_stock_only: string;
};

export function CatalogToolbar({
  categories,
  lang,
  strings,
}: {
  categories: CategoryRow[];
  lang: Locale;
  strings: Strings;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const q = params.get("q") ?? "";
  const cat = params.get("category") ?? "";
  const sort = params.get("sort") ?? "newest";
  const inStock = params.get("in_stock") === "1";

  return (
    <div className="border-y border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:gap-6 lg:px-10">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={q}
            placeholder={strings.search_placeholder}
            onChange={(e) => setParam("q", e.target.value || null)}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button
              type="button"
              onClick={() => setParam("q", null)}
              aria-label="Clear"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ChipButton
            active={!cat}
            onClick={() => setParam("category", null)}
          >
            {strings.all}
          </ChipButton>
          {categories.map((c) => (
            <ChipButton
              key={c.id}
              active={cat === c.slug}
              onClick={() => setParam("category", cat === c.slug ? null : c.slug)}
            >
              {localizedCategoryName(c, lang)}
            </ChipButton>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="h-9 rounded-full border border-border bg-background px-4 text-sm outline-none hover:bg-surface-muted"
          >
            <option value="newest">{strings.newest}</option>
            <option value="price-asc">{strings.price_low}</option>
            <option value="price-desc">{strings.price_high}</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setParam("in_stock", e.target.checked ? "1" : null)}
              className="h-4 w-4 accent-accent"
            />
            {strings.in_stock_only}
          </label>
        </div>
      </div>
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-full border px-4 text-sm transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background hover:bg-surface-muted"
      }`}
    >
      {children}
    </button>
  );
}
