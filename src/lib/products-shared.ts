// Pure helpers + types — safe to import from client components.
import type { Locale } from "@/i18n/config";

export type ProductRow = {
  id: string;
  sku: string;
  slug: string;
  category_id: string | null;
  category_slug: string | null;
  name_en: string;
  name_sw: string | null;
  name_hi: string | null;
  description_en: string | null;
  description_sw: string | null;
  description_hi: string | null;
  selling_techniques_en: string | null;
  selling_techniques_sw: string | null;
  selling_techniques_hi: string | null;
  price_tsh: number;
  stock: number;
  is_featured: boolean;
  wholesale_tiers: { min_qty: number; price_tsh: number }[];
};

export type CategoryRow = {
  id: string;
  slug: string;
  name_en: string;
  name_sw: string | null;
  name_hi: string | null;
};

export function localizedProductName(p: ProductRow, lang: Locale): string {
  return (
    (lang === "sw" && p.name_sw) ||
    (lang === "hi" && p.name_hi) ||
    p.name_en
  );
}

export function localizedProductDescription(
  p: ProductRow,
  lang: Locale,
): string | null {
  return (
    (lang === "sw" && p.description_sw) ||
    (lang === "hi" && p.description_hi) ||
    p.description_en
  );
}

export function localizedSellingTechniques(
  p: ProductRow,
  lang: Locale,
): string | null {
  return (
    (lang === "sw" && p.selling_techniques_sw) ||
    (lang === "hi" && p.selling_techniques_hi) ||
    p.selling_techniques_en
  );
}

export function localizedCategoryName(c: CategoryRow, lang: Locale): string {
  return (
    (lang === "sw" && c.name_sw) ||
    (lang === "hi" && c.name_hi) ||
    c.name_en
  );
}
