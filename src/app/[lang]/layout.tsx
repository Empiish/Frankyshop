import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCurrentStaff } from "@/lib/auth";
import { LanguagePopup } from "@/components/LanguagePopup";
import {
  JsonLd,
  organizationSchema,
  localBusinessSchema,
} from "@/components/StructuredData";
import { getValue } from "@/lib/site-content";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "sw" }, { lang: "hi" }];
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3011";
  return {
    metadataBase: new URL(base),
    title: { default: dict.meta.title, template: `%s · FrankyShop` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: "/en",
        sw: "/sw",
        hi: "/hi",
      },
    },
    openGraph: {
      type: "website",
      url: `/${lang}`,
      siteName: "FrankyShop",
      title: dict.meta.title,
      description: dict.meta.description,
      locale: lang === "sw" ? "sw_TZ" : lang === "hi" ? "hi_IN" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);

  const staff = await getCurrentStaff();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3011";
  const phone = (await getValue("shop_phone")) || "+255 000 000 000";
  const lat = Number((await getValue("shop_lat")) || "-6.8161");
  const lng = Number((await getValue("shop_lng")) || "39.2706");
  const address = (await getValue("shop_address", lang as Locale)) || dict.contact.address_value;
  const hours = (await getValue("shop_hours", lang as Locale)) || dict.contact.hours_value;
  const wa = (await getValue("whatsapp_number")) || "255000000000";

  return (
    <>
      <Header lang={lang as Locale} dict={dict} isStaff={!!staff} />
      <main className="flex-1">{children}</main>
      <Footer lang={lang as Locale} dict={dict} />
      <LanguagePopup currentLocale={lang as Locale} dict={dict.language_popup} />
      <JsonLd data={organizationSchema(siteUrl, address)} />
      <JsonLd data={localBusinessSchema({ siteUrl, whatsapp: wa, phone, address, lat, lng, hours })} />
    </>
  );
}
