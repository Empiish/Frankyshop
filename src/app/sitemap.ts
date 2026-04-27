import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";
import { locales } from "@/i18n/config";

const STATIC_PATHS = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/products", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3011";
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const s of STATIC_PATHS) {
      entries.push({
        url: `${base}/${locale}${s.path}`,
        changeFrequency: s.changeFrequency,
        priority: s.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${base}/${l}${s.path}`]),
          ),
        },
      });
    }
  }

  let products: { slug: string; updated_at: string }[] = [];
  let categories: { slug: string }[] = [];
  try {
    products = await sql<{ slug: string; updated_at: string }[]>`
      select slug, updated_at from products where is_active = true order by updated_at desc
    `;
    categories = await sql<{ slug: string }[]>`
      select slug from categories order by sort_order asc
    `;
  } catch {
    // DB unreachable during build — return what we have so the route still works
  }

  for (const locale of locales) {
    for (const c of categories) {
      entries.push({
        url: `${base}/${locale}/products?category=${c.slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const p of products) {
      entries.push({
        url: `${base}/${locale}/products/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
