// Mock payment provider — simulates a successful M-Pesa STK push.
// 4s after initiate returns, the order is flipped to paid in DataNexus
// so the storefront's confirmation poll picks it up. Used whenever
// MPESA_TZ_API_KEY is empty (i.e. dev without Vodacom sandbox creds).

import { sql } from "@/lib/db";
import type {
  PaymentProvider,
  InitiatePaymentInput,
  InitiatePaymentResult,
} from "./types";

export const mockProvider: PaymentProvider = {
  name: "mock",
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const ref = `MOCK-${Date.now().toString(36).toUpperCase()}`;
    // Fire-and-forget background "approval" — runs in node process for the
    // life of the dev server. Production should use a real provider.
    setTimeout(async () => {
      try {
        await sql`
          update orders set
            status = 'paid',
            payment_ref = ${ref},
            paid_at = coalesce(paid_at, now()),
            updated_at = now()
          where id = ${input.orderId} and status = 'pending'
        `;
        const [row] = await sql<{ customer_id: string | null; total_tsh: number }[]>`
          select customer_id, total_tsh from orders where id = ${input.orderId}
        `;
        if (row?.customer_id) {
          const points = Math.floor(row.total_tsh / 1000);
          if (points > 0) {
            await sql`
              update customers
              set loyalty_points = loyalty_points + ${points}
              where id = ${row.customer_id}
            `;
          }
        }
      } catch (err) {
        console.error("[mock-payment] background flip failed", err);
      }
    }, 4_000).unref?.();

    return { ok: true, provider: "mock", transactionRef: ref };
  },
};
