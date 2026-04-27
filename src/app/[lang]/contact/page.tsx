import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { MessageCircle, Phone, MapPin, Clock } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getValue } from "@/lib/site-content";

const ShopMap = dynamic(() => import("@/components/ShopMap").then((m) => m.ShopMap), {
  loading: () => (
    <div className="h-[420px] w-full overflow-hidden rounded-[2rem] border border-border bg-surface-muted" />
  ),
});

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const L = lang as Locale;

  const wa = (await getValue("whatsapp_number")).replace(/[^\d]/g, "") || "255000000000";
  const phone = (await getValue("shop_phone")) || "+255 000 000 000";
  const lat = Number((await getValue("shop_lat")) || "-6.8161");
  const lng = Number((await getValue("shop_lng")) || "39.2706");
  const address = (await getValue("shop_address", L)) || dict.contact.address_value;
  const hours = (await getValue("shop_hours", L)) || dict.contact.hours_value;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
      <p className="eyebrow">{dict.contact.eyebrow}</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl lg:text-6xl">
        {dict.contact.title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        {dict.contact.subtitle}
      </p>

      <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5 lg:pt-2">
          <ContactRow
            icon={<MessageCircle className="h-5 w-5" />}
            title={dict.contact.whatsapp_label}
            value={`+${wa}`}
            href={`https://wa.me/${wa}`}
            external
          />
          <ContactRow
            icon={<Phone className="h-5 w-5" />}
            title={dict.contact.phone_label}
            value={phone}
            href={`tel:${phone.replace(/\s/g, "")}`}
          />
          <ContactRow
            icon={<MapPin className="h-5 w-5" />}
            title={dict.contact.address_label}
            value={address}
          />
          <ContactRow
            icon={<Clock className="h-5 w-5" />}
            title={dict.contact.hours_label}
            value={hours}
          />
        </div>

        <div className="lg:col-span-7">
          <ShopMap lat={lat} lng={lng} label={address} />
          <p className="mt-3 text-xs text-muted-foreground">
            {dict.contact.map_caption}
          </p>
        </div>
      </div>
    </section>
  );
}

function ContactRow({
  icon,
  title,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <div className="flex items-start gap-4 border-b border-border py-6 first:border-t">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-foreground">
        {icon}
      </span>
      <div>
        <p className="eyebrow">{title}</p>
        <p className="mt-1 text-base font-medium">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group block transition-colors [&_p:last-child]:group-hover:text-accent"
    >
      {inner}
    </a>
  ) : (
    inner
  );
}
