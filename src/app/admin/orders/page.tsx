import Link from "next/link";
import { sql } from "@/lib/db";
import { formatTSh } from "@/lib/utils";
import { requireStaff } from "@/lib/auth";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

const VALID_STATUSES = ["pending","paid","failed","refunded","shipped","delivered","cancelled"] as const;

type Row = {
  id: string;
  public_code: string;
  customer_name: string;
  customer_phone: string;
  total_tsh: number;
  status: string;
  payment_method: string | null;
  created_at: string;
};

export default async function AdminOrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  await requireStaff();
  const sp = (await searchParams) as { status?: string };
  const status = sp.status && (VALID_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "all";

  const filterClause = status === "all" ? sql`` : sql`where status = ${status}`;
  const rows = await sql<Row[]>`
    select id, public_code, customer_name, customer_phone, total_tsh, status, payment_method, created_at
    from orders
    ${filterClause}
    order by created_at desc
    limit 200
  `;

  return (
    <div>
      <p className="eyebrow">Orders</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">All orders</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Most recent 200. Click an order to update its status or WhatsApp the customer.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => {
          const active = (sp.status ?? "all") === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/admin/orders" : `/admin/orders?status=${t.key}`}
              className={`h-9 rounded-full border px-4 text-sm flex items-center transition-colors ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface hover:bg-surface-muted"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Order</th>
              <th className="px-5 py-3 text-left font-medium">Customer</th>
              <th className="px-5 py-3 text-left font-medium">Phone</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
              <th className="px-5 py-3 text-left font-medium">Method</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Placed</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                  No orders match this filter.
                </td>
              </tr>
            )}
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-border hover:bg-surface-muted">
                <td className="px-5 py-3 font-mono text-xs">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-accent">
                    {o.public_code}
                  </Link>
                </td>
                <td className="px-5 py-3">{o.customer_name}</td>
                <td className="px-5 py-3 text-muted-foreground">{o.customer_phone}</td>
                <td className="px-5 py-3 text-right tabular-nums">TSh {formatTSh(o.total_tsh)}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{o.payment_method ?? "—"}</td>
                <td className="px-5 py-3">
                  <StatusPill status={o.status} />
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "paid" || status === "delivered"
      ? "bg-emerald-50 text-emerald-700"
      : status === "shipped"
        ? "bg-sky-50 text-sky-700"
        : status === "pending"
          ? "bg-accent-soft text-accent"
          : status === "cancelled" || status === "failed" || status === "refunded"
            ? "bg-stone-100 text-muted-foreground"
            : "bg-stone-100 text-muted-foreground";
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium uppercase tracking-wider ${tone}`}>
      {status}
    </span>
  );
}
