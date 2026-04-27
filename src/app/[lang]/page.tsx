import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Smartphone, Truck, MapPin } from "lucide-react";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            {dict.hero.kicker}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
            {dict.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            {dict.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${lang}/products`}
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {dict.hero.cta_shop}
            </Link>
            <Link
              href={`/${lang}/about`}
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-7 text-sm font-medium transition-colors hover:bg-surface-muted"
            >
              {dict.hero.cta_about}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-3">
          <TrustItem icon={<Smartphone className="h-5 w-5" />} label={dict.trust.mpesa} />
          <TrustItem icon={<Truck className="h-5 w-5" />} label={dict.trust.delivery} />
          <TrustItem icon={<MapPin className="h-5 w-5" />} label={dict.trust.kariakoo} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          {dict.nav.products}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {dict.common.loading} — catalog ships in Phase 1.
        </p>
      </section>
    </div>
  );
}

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
