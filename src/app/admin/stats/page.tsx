import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatTSh } from "@/lib/utils";

type Totals = {
  orders_30: number;
  revenue_30: number;
  orders_7: number;
  revenue_7: number;
};

type TopProduct = {
  sku: string;
  name: string;
  units: number;
  revenue_tsh: number;
};

export default async function AdminStatsPage() {
  await requireStaff();
  const [totals] = await sql<Totals[]>`
    select
      (select count(*)::int from orders where status in ('paid','shipped','delivered') and created_at >= now() - interval '30 days') as orders_30,
      (select coalesce(sum(total_tsh),0)::int from orders where status in ('paid','shipped','delivered') and created_at >= now() - interval '30 days') as revenue_30,
      (select count(*)::int from orders where status in ('paid','shipped','delivered') and created_at >= now() - interval '7 days') as orders_7,
      (select coalesce(sum(total_tsh),0)::int from orders where status in ('paid','shipped','delivered') and created_at >= now() - interval '7 days') as revenue_7
  `;

  const top = await sql<TopProduct[]>`
    select oi.sku, oi.name,
           sum(oi.quantity)::int as units,
           sum(oi.line_total_tsh)::int as revenue_tsh
    from order_items oi
    join orders o on o.id = oi.order_id
    where o.status in ('paid','shipped','delivered')
      and o.created_at >= now() - interval '30 days'
    group by oi.sku, oi.name
    order by units desc
    limit 10
  `;

  return (
    <div>
      <p className="eyebrow">Statistics</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">Performance</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Orders · 7d" value={String(totals.orders_7)} />
        <Tile label="Revenue · 7d" value={`TSh ${formatTSh(totals.revenue_7)}`} />
        <Tile label="Orders · 30d" value={String(totals.orders_30)} />
        <Tile label="Revenue · 30d" value={`TSh ${formatTSh(totals.revenue_30)}`} />
      </div>

      <div className="mt-12">
        <p className="eyebrow">Top sellers (30 days)</p>
        <h2 className="font-display mt-2 text-2xl">Best by units sold</h2>
        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Product</th>
                <th className="px-5 py-3 text-left font-medium">SKU</th>
                <th className="px-5 py-3 text-right font-medium">Units</th>
                <th className="px-5 py-3 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {top.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                    No paid orders in the last 30 days yet.
                  </td>
                </tr>
              )}
              {top.map((t) => (
                <tr key={t.sku} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{t.name}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{t.sku}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.units}</td>
                  <td className="px-5 py-3 text-right tabular-nums">TSh {formatTSh(t.revenue_tsh)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="eyebrow">{label}</p>
      <p className="font-display mt-3 text-3xl tabular-nums">{value}</p>
    </div>
  );
}
