import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/orders/[code]/status">) {
  const { code } = await ctx.params;
  const rows = await sql<{ status: string; payment_ref: string | null; paid_at: string | null }[]>`
    select status, payment_ref, paid_at from orders where public_code = ${code} limit 1
  `;
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    status: row.status,
    paymentRef: row.payment_ref,
    paidAt: row.paid_at,
  });
}
