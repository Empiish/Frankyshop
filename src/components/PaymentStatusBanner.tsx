"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

type Status = "pending" | "paid" | "failed" | "refunded" | "shipped" | "delivered" | "cancelled";

type Strings = {
  awaiting_title: string;
  awaiting_subtitle: string;
  paid_title: string;
  paid_subtitle: string;
  failed_title: string;
  failed_subtitle: string;
};

export function PaymentStatusBanner({
  orderCode,
  initialStatus,
  strings,
}: {
  orderCode: string;
  initialStatus: Status;
  strings: Strings;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);

  useEffect(() => {
    if (status !== "pending") return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/status`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { status: Status };
        if (!cancelled && json.status !== status) {
          setStatus(json.status);
        }
      } catch {
        // ignore — try again on the next tick
      }
    };
    const id = setInterval(poll, 2000);
    poll();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [orderCode, status]);

  if (status === "paid" || status === "shipped" || status === "delivered") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
        <Check className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">{strings.paid_title}</p>
          <p className="text-sm text-emerald-700">{strings.paid_subtitle}</p>
        </div>
      </div>
    );
  }
  if (status === "failed" || status === "cancelled" || status === "refunded") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-5 py-4 text-danger">
        <div>
          <p className="font-medium">{strings.failed_title}</p>
          <p className="text-sm">{strings.failed_subtitle}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-muted px-5 py-4">
      <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-accent" />
      <div>
        <p className="font-medium">{strings.awaiting_title}</p>
        <p className="text-sm text-muted-foreground">{strings.awaiting_subtitle}</p>
      </div>
    </div>
  );
}
