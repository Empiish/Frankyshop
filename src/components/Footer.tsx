import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-display text-3xl tracking-tight">
              Franky<span className="text-accent">.</span>
            </p>
            <p className="mt-4 max-w-md text-base text-muted-foreground">
              {dict.footer.tagline}
            </p>

            <form className="mt-8 max-w-md">
              <label className="eyebrow block">
                {dict.footer.newsletter_label}
              </label>
              <div className="mt-3 flex items-center border-b border-foreground pb-2">
                <input
                  type="email"
                  placeholder={dict.footer.newsletter_placeholder}
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-7 lg:grid-cols-3">
            <FooterCol title={dict.footer.shop}>
              <Link href={`/${lang}/products`}>{dict.nav.products}</Link>
              <Link href={`/${lang}/products?category=thermos`}>
                {dict.categories.thermos}
              </Link>
              <Link href={`/${lang}/products?category=cutlery`}>
                {dict.categories.cutlery}
              </Link>
              <Link href={`/${lang}/products?category=dishes`}>
                {dict.categories.dishes}
              </Link>
            </FooterCol>
            <FooterCol title={dict.footer.company}>
              <Link href={`/${lang}/about`}>{dict.nav.about}</Link>
              <Link href={`/${lang}/contact`}>{dict.nav.contact}</Link>
            </FooterCol>
            <FooterCol title={dict.footer.support}>
              <a
                href="https://wa.me/255000000000"
                target="_blank"
                rel="noopener noreferrer"
              >
                {dict.footer.contact_whatsapp}
              </a>
              <a href="tel:+255000000000">+255 000 000 000</a>
            </FooterCol>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {year} FrankyShop. {dict.footer.rights}</p>
          <p>{dict.footer.address}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <div className="mt-5 flex flex-col gap-3 text-sm [&_a]:text-foreground [&_a:hover]:text-accent [&_a]:transition-colors">
        {children}
      </div>
    </div>
  );
}
