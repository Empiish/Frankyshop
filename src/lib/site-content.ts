import "server-only";
import { sql } from "@/lib/db";
import type { Locale } from "@/i18n/config";

type Row = {
  key: string;
  value_en: string | null;
  value_sw: string | null;
  value_hi: string | null;
};

export const SITE_KEYS = [
  "whatsapp_number",
  "shop_phone",
  "shop_lat",
  "shop_lng",
  "shop_address",
  "shop_hours",
] as const;

export type SiteKey = (typeof SITE_KEYS)[number];

let cache: Map<string, Row> | null = null;

async function load(): Promise<Map<string, Row>> {
  if (cache) return cache;
  const rows = await sql<Row[]>`select key, value_en, value_sw, value_hi from site_content`;
  cache = new Map(rows.map((r) => [r.key, r]));
  return cache;
}

export function invalidateSiteContent() {
  cache = null;
}

export async function getValue(key: SiteKey, lang: Locale = "en"): Promise<string> {
  const map = await load();
  const row = map.get(key);
  if (!row) return "";
  return (
    (lang === "sw" && row.value_sw) ||
    (lang === "hi" && row.value_hi) ||
    row.value_en ||
    ""
  );
}

export async function getAll(): Promise<Record<string, Row>> {
  const map = await load();
  return Object.fromEntries(map);
}
