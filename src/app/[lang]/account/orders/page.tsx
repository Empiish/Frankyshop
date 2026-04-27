import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { formatTSh } from "@/lib/utils";

type Row = {
  public_code: string;
  total_tsh: number;
  status: string;
  created_at: string;
};

export default async function CustomerOrdersPage({ params }: PageProps<"/[lang]/account/orders">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const session = await requireCustomer(lang);
  const rows = await sql<Row[]>`
    select public_code, total_tsh, status, created_at
    from orders where customer_id = ${session.customerId}
    order by created_at desc
  `;
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 lg:py-20">
      <Link href={`/${lang}/account`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        {dict.account.back_to_account}
      </Link>
      <p className="eyebrow mt-6">{dict.account.eyebrow}</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight">{dict.account.orders}</h1>
      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
          <p className="font-display text-2xl">{dict.account.no_orders}</p>
          <Link href={`/${lang}/products`} className="mt-4 inline-flex text-sm text-accent hover:underline">
            {dict.account.browse}
          </Link>
        </div>
      ) : (
        <div className="mt-10 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">{dict.account.order_code}</th>
                <th className="px-5 py-3 text-right font-medium">{dict.cart.total}</th>
                <th className="px-5 py-3 text-left font-medium">{dict.account.status}</th>
                <th className="px-5 py-3 text-left font-medium">{dict.account.placed}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.public_code} className="border-t border-border hover:bg-surface-muted">
                  <td className="px-5 py-3 font-mono">
                    <Link href={`/${lang}/account/orders/${o.public_code}`} className="font-semibold hover:text-accent">
                      {o.public_code}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">TSh {formatTSh(o.total_tsh)}</td>
                  <td className="px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">{o.status}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
