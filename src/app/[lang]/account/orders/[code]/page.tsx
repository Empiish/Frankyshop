import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { formatTSh } from "@/lib/utils";
import { getValue } from "@/lib/site-content";

type Order = {
  id: string;
  public_code: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  delivery_zone_name: string | null;
  delivery_fee_tsh: number;
  subtotal_tsh: number;
  total_tsh: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
};

type Item = {
  sku: string;
  name: string;
  unit_price_tsh: number;
  quantity: number;
  line_total_tsh: number;
};

export default async function CustomerOrderDetailPage({
  params,
}: PageProps<"/[lang]/account/orders/[code]">) {
  const { lang, code } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const session = await requireCustomer(lang);
  const rows = await sql<Order[]>`
    select o.id, o.public_code, o.customer_name, o.customer_phone,
           o.delivery_address, dz.name_en as delivery_zone_name, o.delivery_fee_tsh,
           o.subtotal_tsh, o.total_tsh, o.status, o.payment_method,
           o.created_at, o.paid_at
    from orders o
    left join delivery_zones dz on dz.id = o.delivery_zone_id
    where o.public_code = ${code} and o.customer_id = ${session.customerId}
    limit 1
  `;
  const o = rows[0];
  if (!o) notFound();
  const items = await sql<Item[]>`
    select sku, name, unit_price_tsh, quantity, line_total_tsh
    from order_items where order_id = ${o.id} order by id asc
  `;

  const wa = (await getValue("whatsapp_number")).replace(/[^\d]/g, "") || "255000000000";
  const waMessage = encodeURIComponent(
    dict.confirmation.whatsapp_msg
      .replace("{code}", o.public_code)
      .replace("{name}", o.customer_name)
      .replace("{total}", `${dict.common.currency} ${formatTSh(o.total_tsh)}`),
  );
  const waLink = `https://wa.me/${wa}?text=${waMessage}`;

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
      <Link href={`/${lang}/account/orders`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        {dict.account.back_to_orders}
      </Link>
      <p className="eyebrow mt-6">{dict.account.eyebrow}</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight">{o.public_code}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {new Date(o.created_at).toLocaleString()} · {o.status}
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <table className="w-full text-sm">
          <tbody>
            {items.map((i) => (
              <tr key={i.sku} className="border-b border-border last:border-0">
                <td className="py-3">
                  <p className="font-medium">{i.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{i.sku} · ×{i.quantity}</p>
                </td>
                <td className="py-3 text-right tabular-nums">TSh {formatTSh(i.line_total_tsh)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <Row label={dict.cart.subtotal} value={`TSh ${formatTSh(o.subtotal_tsh)}`} />
          <Row label={dict.checkout.delivery} value={`TSh ${formatTSh(o.delivery_fee_tsh)}`} />
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-base font-medium">{dict.cart.total}</span>
            <span className="font-display text-2xl tabular-nums">TSh {formatTSh(o.total_tsh)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background hover:bg-accent"
        >
          <MessageCircle className="h-4 w-4" />
          {dict.confirmation.whatsapp_cta}
        </a>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
