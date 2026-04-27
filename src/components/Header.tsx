import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <Link href={`/${lang}`} className="text-lg font-semibold tracking-tight">
          FrankyShop
        </Link>
        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link href={`/${lang}/products`} className="hover:text-primary">
            {dict.nav.products}
          </Link>
          <Link href={`/${lang}/about`} className="hover:text-primary">
            {dict.nav.about}
          </Link>
          <Link href={`/${lang}/contact`} className="hover:text-primary">
            {dict.nav.contact}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm sm:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder={dict.nav.search_placeholder}
              className="w-56 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <LanguageSwitcher currentLocale={lang} />
          <Link
            href={`/${lang}/account`}
            aria-label={dict.nav.account}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted"
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            href={`/${lang}/cart`}
            aria-label={dict.nav.cart}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted"
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
