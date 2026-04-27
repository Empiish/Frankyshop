import Link from "next/link";
import { Plus } from "lucide-react";
import { sql } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

type Row = {
  id: string;
  code: string | null;
  name_en: string;
  type: "percent_off" | "fixed_off" | "bogo";
  value: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  category_name: string | null;
  product_name: string | null;
};

export default async function AdminPromotionsPage() {
  await requireStaff();
  const rows = await sql<Row[]>`
    select p.id, p.code, p.name_en, p.type, p.value,
           p.starts_at, p.ends_at, p.is_active,
           c.name_en as category_name,
           pr.name_en as product_name
    from promotions p
    left join categories c on c.id = p.applies_to_category_id
    left join products   pr on pr.id = p.applies_to_product_id
    order by p.is_active desc, p.created_at desc
  `;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Promotions</p>
          <h1 className="font-display mt-2 text-4xl tracking-tight">Promotions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            % off, fixed off, or BOGO. Schedule start/end and target a category or single product.
          </p>
        </div>
        <Link
          href="/admin/promotions/new"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
          New promotion
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Name</th>
              <th className="px-5 py-3 text-left font-medium">Code</th>
              <th className="px-5 py-3 text-left font-medium">Type</th>
              <th className="px-5 py-3 text-left font-medium">Applies to</th>
              <th className="px-5 py-3 text-left font-medium">Schedule</th>
              <th className="px-5 py-3 text-left font-medium">Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  No promotions yet. Create one to feature on the storefront.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-surface-muted">
                <td className="px-5 py-3">
                  <Link href={`/admin/promotions/${p.id}`} className="font-medium hover:text-accent">
                    {p.name_en}
                  </Link>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.code ?? "—"}</td>
                <td className="px-5 py-3 text-xs">{describeType(p.type, p.value)}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {p.product_name ?? p.category_name ?? "Sitewide"}
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {formatRange(p.starts_at, p.ends_at)}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium uppercase tracking-wider ${
                    p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-muted-foreground"
                  }`}>
                    {p.is_active ? "Active" : "Off"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function describeType(type: string, value: number): string {
  switch (type) {
    case "percent_off": return `${value}% off`;
    case "fixed_off":   return `TSh ${value.toLocaleString()} off`;
    case "bogo":        return `BOGO`;
    default:            return type;
  }
}

function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Always";
  const s = start ? new Date(start).toLocaleDateString() : "—";
  const e = end ? new Date(end).toLocaleDateString() : "—";
  return `${s} → ${e}`;
}
