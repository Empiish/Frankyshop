import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { sql } from "@/lib/db";
import { formatTSh } from "@/lib/utils";
import { requireStaff } from "@/lib/auth";

type DashboardStats = {
  pendingOrders: number;
  paidToday: number;
  revenueToday: number;
  activeProducts: number;
  outOfStock: number;
  newJobApps: number;
};

async function getStats(): Promise<DashboardStats> {
  const [counts] = await sql<DashboardStats[]>`
    select
      (select count(*)::int from orders where status = 'pending') as "pendingOrders",
      (select count(*)::int from orders where status = 'paid' and created_at::date = current_date) as "paidToday",
      (select coalesce(sum(total_tsh),0)::int from orders where status in ('paid','shipped','delivered') and created_at::date = current_date) as "revenueToday",
      (select count(*)::int from products where is_active = true) as "activeProducts",
      (select count(*)::int from products where is_active = true and stock = 0) as "outOfStock",
      (select count(*)::int from job_applications where status = 'new') as "newJobApps"
  `;
  return counts;
}

export default async function AdminDashboard() {
  const session = await requireStaff();
  const s = await getStats();

  return (
    <div>
      <p className="eyebrow">Dashboard</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight">
        Welcome back, {(session.fullName ?? session.email).split(" ")[0]}.
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Quick view of the shop today. Click into any tile to manage it.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          href="/admin/orders?status=pending"
          label="Pending orders"
          value={String(s.pendingOrders)}
          tone={s.pendingOrders > 0 ? "accent" : "muted"}
        />
        <Tile
          href="/admin/orders"
          label="Paid today"
          value={String(s.paidToday)}
        />
        <Tile
          href="/admin/orders"
          label="Revenue today"
          value={`TSh ${formatTSh(s.revenueToday)}`}
        />
        <Tile
          href="/admin/products"
          label="Active products"
          value={String(s.activeProducts)}
        />
        <Tile
          href="/admin/products?stock=out"
          label="Out of stock"
          value={String(s.outOfStock)}
          tone={s.outOfStock > 0 ? "accent" : "muted"}
        />
        <Tile
          href="/admin/jobs"
          label="New job applications"
          value={String(s.newJobApps)}
        />
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <QuickAction
          href="/admin/products/new"
          title="Add a product"
          desc="Upload photos, set price, write copy."
        />
        <QuickAction
          href="/admin/promotions/new"
          title="Run a promotion"
          desc="Percent-off, fixed-off, or BOGO across categories or items."
        />
      </div>
    </div>
  );
}

function Tile({
  href,
  label,
  value,
  tone = "default",
}: {
  href: string;
  label: string;
  value: string;
  tone?: "default" | "accent" | "muted";
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:bg-surface-muted"
    >
      <p className="eyebrow">{label}</p>
      <p
        className={`font-display mt-3 text-4xl tracking-tight tabular-nums ${
          tone === "accent" ? "text-accent" : tone === "muted" ? "text-muted-foreground" : ""
        }`}
      >
        {value}
      </p>
    </Link>
  );
}

function QuickAction({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-6 transition-colors hover:bg-surface-muted"
    >
      <div>
        <p className="font-display text-2xl">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
    </Link>
  );
}
