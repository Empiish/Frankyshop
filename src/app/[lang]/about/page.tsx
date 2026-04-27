import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);

  return (
    <>
      <section className="warm-gradient">
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10 lg:py-32">
          <p className="eyebrow">{dict.about.eyebrow}</p>
          <h1 className="font-display mt-4 text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {dict.about.title_a}{" "}
            <span className="font-display italic text-accent">
              {dict.about.title_b}
            </span>
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10 lg:py-24">
        <p className="text-xl leading-relaxed text-muted-foreground">
          {dict.about.p1}
        </p>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          {dict.about.p2}
        </p>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          {dict.about.p3}
        </p>
      </section>

      <section className="border-t border-border bg-surface-muted">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 sm:grid-cols-3 lg:gap-14 lg:px-10 lg:py-24">
          <Pillar title={dict.about.pillar1_title} body={dict.about.pillar1_body} />
          <Pillar title={dict.about.pillar2_title} body={dict.about.pillar2_body} />
          <Pillar title={dict.about.pillar3_title} body={dict.about.pillar3_body} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center lg:py-24">
        <p className="font-display text-3xl tracking-tight sm:text-4xl">
          {dict.about.cta_title}
        </p>
        <Link
          href={`/${lang}/products`}
          className="group mt-8 inline-flex items-center gap-2 text-base font-medium"
        >
          <span className="border-b border-foreground pb-1 transition-colors group-hover:border-accent group-hover:text-accent">
            {dict.about.cta}
          </span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
        </Link>
      </section>
    </>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="font-display text-2xl">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
