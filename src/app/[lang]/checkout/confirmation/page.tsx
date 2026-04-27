import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sql } from "@/lib/db";
import { formatTSh } from "@/lib/utils";

type OrderRow = {
  id: string;
  public_code: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  total_tsh: number;
  status: string;
  payment_method: string | null;
  created_at: string;
};

export default async function ConfirmationPage({
  params,
  searchParams,
}: PageProps<"/[lang]/checkout/confirmation">) {
  const { lang } = await params;
  const sp = (await searchParams) as { code?: string };
  if (!isLocale(lang) || !sp.code) notFound();
  const dict = await getDictionary(lang as Locale);

  const rows = await sql<OrderRow[]>`
    select id, public_code, customer_name, customer_phone, delivery_address,
           total_tsh, status, payment_method, created_at
    from orders
    where public_code = ${sp.code}
    limit 1
  `;
  const order = rows[0];
  if (!order) notFound();

  const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "255000000000").replace(/[^\d]/g, "");
  const waMessage = encodeURIComponent(
    dict.confirmation.whatsapp_msg
      .replace("{code}", order.public_code)
      .replace("{name}", order.customer_name)
      .replace("{total}", `${dict.common.currency} ${formatTSh(order.total_tsh)}`),
  );
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <section className="mx-auto max-w-2xl px-6 py-20 text-center lg:py-28">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <Check className="h-6 w-6 text-accent" />
      </div>
      <p className="eyebrow mt-7">{dict.confirmation.eyebrow}</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">
        {dict.confirmation.title.replace("{name}", order.customer_name)}
      </h1>
      <p className="mt-5 text-lg text-muted-foreground">
        {dict.confirmation.subtitle.replace("{code}", order.public_code)}
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-surface-muted p-7 text-left">
        <Row label={dict.confirmation.order_code} value={order.public_code} />
        <Row label={dict.checkout.full_name} value={order.customer_name} />
        <Row label={dict.checkout.phone} value={order.customer_phone} />
        {order.delivery_address && (
          <Row label={dict.checkout.address} value={order.delivery_address} />
        )}
        <Row
          label={dict.cart.total}
          value={`${dict.common.currency} ${formatTSh(order.total_tsh)}`}
          big
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background hover:bg-accent"
        >
          {dict.confirmation.whatsapp_cta}
          <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href={`/${lang}/products`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {dict.confirmation.continue_shopping}
        </Link>
      </div>
    </section>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-b border-border/60 py-3 last:border-0 ${
        big ? "pt-5 text-base" : "text-sm"
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={big ? "font-display text-2xl tabular-nums" : "tabular-nums"}>
        {value}
      </span>
    </div>
  );
}
