import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function EditorialBlock({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary;
}) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-32">
        <div className="relative lg:col-span-6">
          <div className="aspect-[5/6] overflow-hidden rounded-[2rem] product-tile-gradient-3" />
          <div className="absolute -bottom-6 -right-6 hidden h-44 w-44 overflow-hidden rounded-full product-tile-gradient-2 shadow-md lg:block" />
        </div>
        <div className="lg:col-span-6 lg:pt-16">
          <p className="eyebrow">{dict.editorial.eyebrow}</p>
          <h2 className="font-display mt-4 text-4xl leading-[1.1] tracking-tight sm:text-5xl">
            {dict.editorial.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {dict.editorial.body_1}
          </p>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {dict.editorial.body_2}
          </p>
          <Link
            href={`/${lang}/about`}
            className="group mt-10 inline-flex items-center gap-2 text-base font-medium"
          >
            <span className="border-b border-foreground pb-1 transition-colors group-hover:border-accent group-hover:text-accent">
              {dict.editorial.cta}
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
          </Link>
        </div>
      </div>
    </section>
  );
}
