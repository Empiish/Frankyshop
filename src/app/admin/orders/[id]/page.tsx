import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { sql } from "@/lib/db";
import { formatTSh } from "@/lib/utils";
import { requireStaff } from "@/lib/auth";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

type Order = {
  id: string;
  public_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_zone_name: string | null;
  delivery_fee_tsh: number;
  subtotal_tsh: number;
  total_tsh: number;
  status: string;
  payment_method: string | null;
  payment_ref: string | null;
  notes: string | null;
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

export default async function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  await requireStaff();
  const { id } = await params;
  const rows = await sql<Order[]>`
    select o.id, o.public_code, o.customer_name, o.customer_phone, o.customer_email,
           o.delivery_address,
           dz.name_en as delivery_zone_name,
           o.delivery_fee_tsh, o.subtotal_tsh, o.total_tsh,
           o.status, o.payment_method, o.payment_ref, o.notes,
           o.created_at, o.paid_at
    from orders o
    left join delivery_zones dz on dz.id = o.delivery_zone_id
    where o.id = ${id}
    limit 1
  `;
  const o = rows[0];
  if (!o) notFound();
  const items = await sql<Item[]>`
    select sku, name, unit_price_tsh, quantity, line_total_tsh
    from order_items where order_id = ${id} order by id asc
  `;

  const wa = o.customer_phone.replace(/[^\d]/g, "");
  const waMessage = encodeURIComponent(
    `Hi ${o.customer_name}! This is Franky from Kariakoo. Following up on your order ${o.public_code} (TSh ${formatTSh(o.total_tsh)}).`,
  );
  const waLink = `https://wa.me/${wa}?text=${waMessage}`;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to orders
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="font-display mt-2 text-4xl tracking-tight">{o.public_code}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Placed {new Date(o.created_at).toLocaleString()}
            {o.paid_at && ` · Paid ${new Date(o.paid_at).toLocaleString()}`}
          </p>
        </div>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background hover:bg-accent"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp customer
        </a>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Items">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-2 text-left font-medium">Item</th>
                  <th className="pb-2 text-left font-medium">SKU</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Unit</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.sku} className="border-t border-border">
                    <td className="py-3">{i.name}</td>
                    <td className="py-3 text-xs text-muted-foreground">{i.sku}</td>
                    <td className="py-3 text-right tabular-nums">{i.quantity}</td>
                    <td className="py-3 text-right tabular-nums">TSh {formatTSh(i.unit_price_tsh)}</td>
                    <td className="py-3 text-right tabular-nums">TSh {formatTSh(i.line_total_tsh)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border text-sm">
                <tr><td colSpan={4} className="pt-3 text-right text-muted-foreground">Subtotal</td><td className="pt-3 text-right tabular-nums">TSh {formatTSh(o.subtotal_tsh)}</td></tr>
                <tr><td colSpan={4} className="text-right text-muted-foreground">Delivery</td><td className="text-right tabular-nums">TSh {formatTSh(o.delivery_fee_tsh)}</td></tr>
                <tr className="border-t border-border"><td colSpan={4} className="pt-3 text-right font-medium">Total</td><td className="pt-3 text-right font-display text-2xl tabular-nums">TSh {formatTSh(o.total_tsh)}</td></tr>
              </tfoot>
            </table>
          </Section>

          <Section title="Customer">
            <Row label="Name" value={o.customer_name} />
            <Row label="Phone" value={o.customer_phone} />
            {o.customer_email && <Row label="Email" value={o.customer_email} />}
            {o.delivery_zone_name && <Row label="Delivery zone" value={o.delivery_zone_name} />}
            {o.delivery_address && <Row label="Address" value={o.delivery_address} />}
            {o.notes && <Row label="Customer notes" value={o.notes} />}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Status">
            <OrderStatusForm
              orderId={o.id}
              currentStatus={o.status}
              currentPaymentRef={o.payment_ref}
            />
          </Section>

          <Section title="Payment">
            <Row label="Method" value={o.payment_method ?? "—"} />
            <Row label="Reference" value={o.payment_ref ?? "—"} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="font-display text-xl">{title}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
