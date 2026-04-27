import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";

type JobApp = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  position: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export default async function AdminJobsPage() {
  await requireStaff();
  const apps = await sql<JobApp[]>`
    select id, full_name, phone, email, position, message, status, created_at
    from job_applications order by created_at desc limit 100
  `;

  return (
    <div>
      <p className="eyebrow">Hiring</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">Job applications</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {apps.length === 0
          ? "No applications yet. The public job form ships in Phase 6."
          : `${apps.length} application${apps.length === 1 ? "" : "s"}.`}
      </p>

      {apps.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Applicant</th>
                <th className="px-5 py-3 text-left font-medium">Phone</th>
                <th className="px-5 py-3 text-left font-medium">Position</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{a.full_name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.phone}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.position ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.status}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
