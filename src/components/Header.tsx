"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-all ${
        scrolled
          ? "border-b border-border bg-background/95 backdrop-blur"
          : "border-b border-transparent bg-background"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-5 lg:px-10">
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted md:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <Link
          href={`/${lang}`}
          className="font-display text-xl font-semibold tracking-tight"
        >
          Franky<span className="text-accent">.</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-7 text-sm md:flex">
          <Link href={`/${lang}/products`} className="hover:text-accent transition-colors">
            {dict.nav.products}
          </Link>
          <Link href={`/${lang}/about`} className="hover:text-accent transition-colors">
            {dict.nav.about}
          </Link>
          <Link href={`/${lang}/contact`} className="hover:text-accent transition-colors">
            {dict.nav.contact}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted"
          >
            <Search className="h-4 w-4" />
          </button>
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
            className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted"
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-background">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4 lg:px-10">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              autoFocus
              placeholder={dict.nav.search_placeholder}
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Esc
            </button>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col px-6 py-2">
            {(
              [
                ["products", dict.nav.products],
                ["about", dict.nav.about],
                ["contact", dict.nav.contact],
              ] as const
            ).map(([slug, label]) => (
              <Link
                key={slug}
                href={`/${lang}/${slug}`}
                onClick={() => setMobileOpen(false)}
                className="border-b border-border py-3 text-base last:border-0"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
