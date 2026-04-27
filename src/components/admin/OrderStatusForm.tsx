"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/orders/actions";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
] as const;

export function OrderStatusForm({
  orderId,
  currentStatus,
  currentPaymentRef,
}: {
  orderId: string;
  currentStatus: string;
  currentPaymentRef: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(formData);
      if (res.ok) setSavedAt(new Date().toLocaleTimeString());
      else setError(res.error);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={orderId} />
      <label className="block">
        <span className="text-sm font-medium">Status</span>
        <select name="status" defaultValue={currentStatus} className="input mt-2">
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Payment reference</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">M-Pesa transaction ID, etc.</span>
        <input name="payment_ref" defaultValue={currentPaymentRef ?? ""} className="input mt-2" />
      </label>
      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background hover:bg-accent disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {savedAt && <p className="text-center text-xs text-muted-foreground">Saved at {savedAt}</p>}
    </form>
  );
}
