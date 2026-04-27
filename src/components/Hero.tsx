import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function Hero({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <section className="warm-gradient relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 sm:py-28 lg:grid-cols-12 lg:gap-12 lg:px-10 lg:py-32">
        <div className="lg:col-span-7">
          <p className="eyebrow">{dict.hero.kicker}</p>
          <h1 className="font-display mt-5 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
            {dict.hero.title_a}{" "}
            <span className="font-display italic text-accent">
              {dict.hero.title_b}
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {dict.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href={`/${lang}/products`}
              className="group inline-flex items-center gap-2 text-base font-medium text-foreground"
            >
              <span className="border-b border-foreground pb-1 transition-colors group-hover:border-accent group-hover:text-accent">
                {dict.hero.cta_shop}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
            </Link>
            <Link
              href={`/${lang}/about`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {dict.hero.cta_about}
            </Link>
          </div>
        </div>

        {/* Right: editorial image cluster (placeholders until real photos arrive) */}
        <div className="relative hidden h-[520px] lg:col-span-5 lg:block">
          <div className="absolute right-0 top-0 h-[360px] w-[280px] overflow-hidden rounded-[2rem] product-tile-gradient-2 shadow-sm" />
          <div className="absolute bottom-0 left-0 h-[260px] w-[220px] overflow-hidden rounded-[2rem] product-tile-gradient-1 shadow-sm" />
          <div className="absolute left-[40%] top-[35%] h-[180px] w-[180px] overflow-hidden rounded-full product-tile-gradient-4 shadow-sm" />
        </div>
      </div>

      {/* Trust strip */}
      <div className="border-t border-border/70 bg-background/60 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 sm:grid-cols-3 lg:px-10">
          <TrustItem label={dict.trust.mpesa} />
          <TrustItem label={dict.trust.delivery} />
          <TrustItem label={dict.trust.kariakoo} />
        </div>
      </div>
    </section>
  );
}

function TrustItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
