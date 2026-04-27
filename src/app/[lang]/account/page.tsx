import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Heart, Package, Sparkles } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { formatTSh } from "@/lib/utils";
import { CustomerSignOutButton } from "@/components/CustomerSignOutButton";

type RecentOrder = {
  public_code: string;
  total_tsh: number;
  status: string;
  created_at: string;
};

type Counts = { wishlist: number; loyalty_points: number };

export default async function AccountDashboardPage({ params }: PageProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const session = await requireCustomer(lang);

  const [recent, counts] = await Promise.all([
    sql<RecentOrder[]>`
      select public_code, total_tsh, status, created_at
      from orders where customer_id = ${session.customerId}
      order by created_at desc
      limit 3
    `,
    sql<Counts[]>`
      select
        (select count(*)::int from wishlist_items where customer_id = ${session.customerId}) as wishlist,
        (select coalesce(loyalty_points, 0) from customers where id = ${session.customerId}) as loyalty_points
    `,
  ]);
  const c = counts[0] ?? { wishlist: 0, loyalty_points: 0 };

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{dict.account.eyebrow}</p>
          <h1 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">
            {dict.account.welcome.replace("{name}", (session.fullName ?? session.email).split(" ")[0])}
          </h1>
        </div>
        <CustomerSignOutButton lang={lang as Locale} label={dict.account.sign_out} />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Tile
          href={`/${lang}/account/orders`}
          icon={<Package className="h-4 w-4" />}
          label={dict.account.orders}
          value={String(recent.length)}
        />
        <Tile
          href={`/${lang}/account/wishlist`}
          icon={<Heart className="h-4 w-4" />}
          label={dict.account.wishlist}
          value={String(c.wishlist)}
        />
        <Tile
          icon={<Sparkles className="h-4 w-4" />}
          label={dict.account.loyalty}
          value={String(c.loyalty_points)}
          hint={dict.account.loyalty_hint}
        />
      </div>

      <div className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">{dict.account.recent_orders}</h2>
          <Link
            href={`/${lang}/account/orders`}
            className="group inline-flex items-center gap-1.5 text-sm"
          >
            <span className="border-b border-foreground pb-0.5 transition-colors group-hover:border-accent group-hover:text-accent">
              {dict.account.see_all_orders}
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
            <p className="font-display text-2xl">{dict.account.no_orders}</p>
            <Link
              href={`/${lang}/products`}
              className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              {dict.account.browse}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
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
                {recent.map((o) => (
                  <tr key={o.public_code} className="border-t border-border hover:bg-surface-muted">
                    <td className="px-5 py-3 font-mono">
                      <Link href={`/${lang}/account/orders/${o.public_code}`} className="font-semibold hover:text-accent">
                        {o.public_code}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">TSh {formatTSh(o.total_tsh)}</td>
                    <td className="px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">{o.status}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Tile({
  href,
  icon,
  label,
  value,
  hint,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
          {icon}
        </span>
        <p className="eyebrow">{label}</p>
      </div>
      <p className="font-display mt-3 text-3xl tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-colors hover:[&>div]:bg-surface-muted">
      {inner}
    </Link>
  ) : (
    inner
  );
}
