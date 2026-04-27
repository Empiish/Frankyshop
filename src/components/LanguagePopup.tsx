"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";

const COOKIE = "franky_locale";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function LanguagePopup({
  currentLocale,
  dict,
}: {
  currentLocale: Locale;
  dict: { title: string; subtitle: string; continue: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [picked, setPicked] = useState<Locale>(currentLocale);

  useEffect(() => {
    if (!readCookie(COOKIE)) setShow(true);
  }, []);

  if (!show) return null;

  function confirm() {
    document.cookie = `${COOKIE}=${picked}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setShow(false);
    if (picked !== currentLocale) {
      const segments = pathname.split("/");
      if (segments[1] && (locales as readonly string[]).includes(segments[1])) {
        segments[1] = picked;
      } else {
        segments.splice(1, 0, picked);
      }
      router.push(segments.join("/") || `/${picked}`);
      router.refresh();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <h2 id="lang-popup-title" className="text-xl font-semibold">
          {dict.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{dict.subtitle}</p>
        <div className="mt-5 flex flex-col gap-2">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setPicked(l)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                picked === l
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-surface-muted"
              }`}
            >
              <span className="font-medium">{localeNames[l]}</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {l}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={confirm}
          className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          {dict.continue}
        </button>
      </div>
    </div>
  );
}
