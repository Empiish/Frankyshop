"use client";

import { useState } from "react";
import { FlaskConical, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { placeOrder } from "@/app/[lang]/checkout/actions";

const TEST_ITEMS = [
  { productId: "4c7321ca-b3c6-4ef9-8be4-b3b621ad0561", sku: "FK-PL-002", name: "Food Storage Container 5L", unitPriceTsh: 12000, quantity: 2 },
  { productId: "c0d2a914-ad70-446e-9c25-684c603cf99a", sku: "FK-CT-003", name: "Shoe Brush", unitPriceTsh: 7500, quantity: 1 },
];

export default function TestOrderPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+255700000000");
  const [name, setName] = useState("Test Customer");
  const [zoneId, setZoneId] = useState("");
  const [result, setResult] = useState<{ ok: boolean; code?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function runTest() {
    if (!zoneId) { alert("Enter a delivery zone UUID from the DB first"); return; }
    setLoading(true);
    setResult(null);
    const res = await placeOrder({
      customerName: name,
      customerPhone: phone,
      customerEmail: email || undefined,
      deliveryZoneId: zoneId,
      deliveryAddress: "Test Street 1, Kariakoo, Dar es Salaam",
      notes: "ADMIN TEST ORDER — do not fulfil",
      paymentMethod: "mpesa",
      items: TEST_ITEMS,
      testMode: true,
    });
    setLoading(false);
    setResult(res.ok ? { ok: true, code: res.orderCode } : { ok: false, error: res.error });
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
          <FlaskConical className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="eyebrow">Admin tool</p>
          <h1 className="font-display text-3xl tracking-tight">Test Order</h1>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground max-w-lg">
        Places a test order that is immediately marked as <strong>paid</strong> — no M-Pesa prompt is sent.
        If you enter an email, the full confirmation receipt is fired so you can verify it end-to-end.
        Test orders are labelled <em>⚠ TEST ORDER</em> in the receipt and in the orders list.
      </p>

      <div className="mt-8 rounded-2xl border border-border p-7 flex flex-col gap-5">
        <Field label="Customer name">
          <input className="input" value={name} onChange={e => setName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
        </Field>
        <Field label="Email (receipt will be sent here)">
          <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
        </Field>
        <Field label="Delivery zone UUID">
          <input className="input font-mono text-sm" value={zoneId} onChange={e => setZoneId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          <p className="mt-1 text-xs text-muted-foreground">Get this from the DB: SELECT id, name_en FROM app_frankyshop.delivery_zones;</p>
        </Field>

        <div className="rounded-xl bg-surface-muted p-4 text-sm">
          <p className="font-medium mb-2">Test items (fixed):</p>
          {TEST_ITEMS.map(it => (
            <p key={it.sku} className="text-muted-foreground">{it.name} × {it.quantity} — TSh {it.unitPriceTsh.toLocaleString()}</p>
          ))}
        </div>

        <button
          type="button"
          onClick={runTest}
          disabled={loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Placing test order…" : "Place test order"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {result && (
        <div className={`mt-6 rounded-2xl border p-6 flex items-start gap-4 ${result.ok ? "border-green-200 bg-green-50" : "border-danger/30 bg-danger/5"}`}>
          {result.ok
            ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            : <XCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />}
          <div>
            {result.ok ? (
              <>
                <p className="font-medium text-green-800">Test order placed — {result.code}</p>
                <p className="mt-1 text-sm text-green-700">Status set to <strong>paid</strong>. Check your inbox for the receipt email.{" "}
                  <a href={`/en/checkout/confirmation?code=${result.code}`} className="underline">View confirmation page →</a>
                </p>
              </>
            ) : (
              <p className="font-medium text-danger">{result.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
