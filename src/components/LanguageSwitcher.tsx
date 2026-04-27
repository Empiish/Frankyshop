"use client";

import { usePathname, useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { useState } from "react";
import { locales, localeNames, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function switchTo(next: Locale) {
    document.cookie = `franky_locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    const segments = pathname.split("/");
    if (segments[1] && (locales as readonly string[]).includes(segments[1])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    setOpen(false);
    router.push(segments.join("/") || `/${next}`);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Change language"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm hover:bg-surface-muted"
      >
        <Languages className="h-4 w-4" />
        <span className="font-medium">{currentLocale.toUpperCase()}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          {locales.map((l) => (
            <button
              key={l}
              role="menuitem"
              onClick={() => switchTo(l)}
              className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-surface-muted ${
                l === currentLocale ? "font-semibold text-primary" : ""
              }`}
            >
              {localeNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
