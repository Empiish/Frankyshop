import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-semibold">FrankyShop</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Kariakoo, Dar es Salaam
          </p>
        </div>
        <FooterCol title={dict.footer.shop}>
          <Link href={`/${lang}/products`}>{dict.nav.products}</Link>
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
        </FooterCol>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-6 py-5 text-xs text-muted-foreground">
          © {year} FrankyShop. {dict.footer.rights}
        </p>
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
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground [&_a:hover]:text-primary">
        {children}
      </div>
    </div>
  );
}
