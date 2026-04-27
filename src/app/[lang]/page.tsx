import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Hero } from "@/components/Hero";
import { CategoryCircles } from "@/components/CategoryCircles";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { EditorialBlock } from "@/components/EditorialBlock";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);

  return (
    <>
      <Hero lang={lang as Locale} dict={dict} />
      <CategoryCircles lang={lang as Locale} />
      <CategoryShowcase lang={lang as Locale} dict={dict} />
      <FeaturedProducts lang={lang as Locale} dict={dict} />
      <EditorialBlock lang={lang as Locale} dict={dict} />
    </>
  );
}
