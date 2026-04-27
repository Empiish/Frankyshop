export const locales = ["en", "sw", "hi"] as const;
export const defaultLocale = "en" as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  sw: "Kiswahili",
  hi: "हिन्दी",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
