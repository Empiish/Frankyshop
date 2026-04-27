// Lightweight server-only structured-data emitters.
// JSON-LD via <script type="application/ld+json"> per Next 16 docs guidance.

type Props = { data: unknown };

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationSchema(siteUrl: string, address: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FrankyShop",
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    address,
  };
}

export function localBusinessSchema(opts: {
  siteUrl: string;
  whatsapp: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  hours: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "FrankyShop",
    description: "Quality houseware in Kariakoo, Dar es Salaam.",
    url: opts.siteUrl,
    telephone: opts.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kariakoo",
      addressLocality: "Dar es Salaam",
      addressCountry: "TZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: opts.lat,
      longitude: opts.lng,
    },
    openingHours: opts.hours,
  };
}

export function productSchema(p: {
  name: string;
  description: string | null;
  sku: string;
  url: string;
  image: string | null;
  priceTsh: number;
  inStock: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? undefined,
    sku: p.sku,
    url: p.url,
    image: p.image ?? undefined,
    brand: { "@type": "Brand", name: "FrankyShop" },
    offers: {
      "@type": "Offer",
      url: p.url,
      priceCurrency: "TZS",
      price: p.priceTsh,
      availability: p.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
