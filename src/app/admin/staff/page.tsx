import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

type StaffRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "staff";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export default async function AdminStaffPage() {
  await requireAdmin();
  const rows = await sql<StaffRow[]>`
    select id, email, full_name, role, is_active, last_login_at, created_at
    from staff_users
    order by role asc, created_at asc
  `;

  return (
    <div>
      <p className="eyebrow">Team</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">Staff</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Admins can manage everything. Staff can manage products, orders, promotions, content, and jobs — but not other staff or settings.
        Inviting new staff by email + revoking access ships in Phase 8.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Person</th>
              <th className="px-5 py-3 text-left font-medium">Email</th>
              <th className="px-5 py-3 text-left font-medium">Role</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Last login</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-5 py-3 font-medium">{s.full_name ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{s.email}</td>
                <td className="px-5 py-3 text-xs uppercase tracking-wider">{s.role}</td>
                <td className="px-5 py-3 text-sm">{s.is_active ? "Active" : "Disabled"}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {s.last_login_at ? new Date(s.last_login_at).toLocaleString() : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
