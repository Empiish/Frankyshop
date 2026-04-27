import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  FileText,
  Briefcase,
  BarChart3,
  Users,
  ExternalLink,
} from "lucide-react";
import type { StaffSession } from "@/lib/auth-shared";
import { SignOutButton } from "./SignOutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/content", label: "Site content", icon: FileText },
  { href: "/admin/jobs", label: "Job applications", icon: Briefcase },
  { href: "/admin/stats", label: "Statistics", icon: BarChart3 },
] as const;

const ADMIN_ONLY = [
  { href: "/admin/staff", label: "Staff", icon: Users },
] as const;

export function AdminShell({
  session,
  children,
}: {
  session: StaffSession;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <aside className="hidden flex-col border-r border-border bg-surface-muted px-5 py-7 lg:flex">
        <Link href="/admin" className="font-display text-2xl tracking-tight">
          Franky<span className="text-accent">.</span>
        </Link>
        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          Admin
        </p>

        <nav className="mt-10 flex flex-1 flex-col gap-0.5 text-sm">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          {session.role === "admin" && (
            <>
              <div className="my-4 border-t border-border" />
              {ADMIN_ONLY.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </>
          )}
        </nav>

        <div className="mt-6 border-t border-border pt-5 text-xs">
          <Link
            href="/en"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-accent"
          >
            View storefront
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-6 rounded-2xl bg-surface p-4">
          <p className="text-sm font-medium leading-tight">
            {session.fullName ?? session.email}
          </p>
          <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
            {session.role}
          </p>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:hidden">
          <Link href="/admin" className="font-display text-xl">
            Franky<span className="text-accent">.</span>
          </Link>
          <SignOutButton compact />
        </header>
        <main className="flex-1 px-6 py-8 lg:px-12 lg:py-12">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-foreground hover:bg-surface"
    >
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
      <span>{label}</span>
    </Link>
  );
}
