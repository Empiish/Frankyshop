import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { sql } from "@/lib/db";
import { formatTSh } from "@/lib/utils";
import { requireStaff } from "@/lib/auth";

type Row = {
  id: string;
  sku: string;
  slug: string;
  name_en: string;
  category_name: string | null;
  price_tsh: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
};

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  await requireStaff();
  const sp = (await searchParams) as { q?: string; stock?: string; status?: string };
  const q = (sp.q ?? "").trim();
  const stockOut = sp.stock === "out";
  const statusInactive = sp.status === "inactive";

  const searchClause = q
    ? sql`and (p.name_en ilike ${"%" + q + "%"} or p.sku ilike ${"%" + q + "%"})`
    : sql``;
  const stockClause = stockOut ? sql`and p.stock = 0` : sql``;
  const statusClause = statusInactive ? sql`and p.is_active = false` : sql``;

  const rows = await sql<Row[]>`
    select p.id, p.sku, p.slug, p.name_en,
           c.name_en as category_name,
           p.price_tsh, p.stock, p.is_active, p.is_featured
    from products p
    left join categories c on c.id = p.category_id
    where 1=1 ${searchClause} ${stockClause} ${statusClause}
    order by p.created_at desc
  `;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="font-display mt-2 text-4xl tracking-tight">Products</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "item" : "items"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
          New product
        </Link>
      </div>

      <form className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or SKU…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="stock" value="out" defaultChecked={stockOut} className="h-4 w-4 accent-accent" />
          Out of stock
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="status" value="inactive" defaultChecked={statusInactive} className="h-4 w-4 accent-accent" />
          Inactive
        </label>
        <button type="submit" className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:bg-accent">
          Filter
        </button>
      </form>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Product</th>
              <th className="px-5 py-3 text-left font-medium">SKU</th>
              <th className="px-5 py-3 text-left font-medium">Category</th>
              <th className="px-5 py-3 text-right font-medium">Price</th>
              <th className="px-5 py-3 text-right font-medium">Stock</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  No products match your filters.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-surface-muted">
                <td className="px-5 py-3">
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-accent">
                    {p.name_en}
                  </Link>
                </td>
                <td className="px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                  {p.sku}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{p.category_name ?? "—"}</td>
                <td className="px-5 py-3 text-right tabular-nums">TSh {formatTSh(p.price_tsh)}</td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {p.stock === 0 ? <span className="text-danger">0</span> : p.stock}
                </td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2 text-xs">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        p.is_active ? "bg-emerald-600" : "bg-muted-foreground"
                      }`}
                    />
                    {p.is_active ? "Active" : "Inactive"}
                    {p.is_featured && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                        Featured
                      </span>
                    )}
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
