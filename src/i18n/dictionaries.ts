import "server-only";
import type { Locale } from "./config";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  sw: () => import("./dictionaries/sw.json").then((m) => m.default),
  hi: () => import("./dictionaries/hi.json").then((m) => m.default),
} satisfies Record<Locale, () => Promise<Dictionary>>;

export type Dictionary = typeof import("./dictionaries/en.json");

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
