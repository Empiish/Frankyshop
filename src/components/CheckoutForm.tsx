"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Smartphone, CreditCard } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCart, cartSubtotal } from "@/stores/cart";
import { formatTSh } from "@/lib/utils";
import { placeOrder } from "@/app/[lang]/checkout/actions";

type Zone = { id: string; name: string; fee_tsh: number };

type Step = 1 | 2 | 3;

export function CheckoutForm({
  lang,
  dict,
  zones,
  prefill,
}: {
  lang: Locale;
  dict: Dictionary;
  zones: Zone[];
  prefill?: { name: string; phone: string; email: string };
}) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const subtotal = cartSubtotal(items);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [step, setStep] = useState<Step>(1);
  const [customerName, setCustomerName] = useState(prefill?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState(prefill?.phone ?? "");
  const [customerEmail, setCustomerEmail] = useState(prefill?.email ?? "");
  const [deliveryZoneId, setDeliveryZoneId] = useState(zones[0]?.id ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card_placeholder">("mpesa");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zone = useMemo(
    () => zones.find((z) => z.id === deliveryZoneId) ?? zones[0],
    [zones, deliveryZoneId],
  );
  const total = subtotal + (zone?.fee_tsh ?? 0);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-muted-foreground">{dict.common.loading}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">{dict.cart.empty_title}</h1>
        <Link
          href={`/${lang}/products`}
          className="group mt-8 inline-flex items-center gap-2 text-base font-medium"
        >
          <span className="border-b border-foreground pb-1 group-hover:text-accent group-hover:border-accent">
            {dict.cart.empty_cta}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const canAdvance1 = customerName.trim() && customerPhone.trim().length >= 7;
  const canAdvance2 = deliveryZoneId && deliveryAddress.trim();
  const canSubmit = canAdvance1 && canAdvance2 && paymentMethod;

  async function submit() {
    if (paymentMethod === "card_placeholder") {
      setError(dict.checkout.card_disabled);
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await placeOrder({
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      deliveryZoneId,
      deliveryAddress,
      notes: notes || undefined,
      paymentMethod,
      items: items.map((i) => ({
        productId: i.productId,
        sku: i.sku,
        name: i.name,
        unitPriceTsh: i.unitPriceTsh,
        quantity: i.quantity,
      })),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    clearCart();
    router.push(`/${lang}/checkout/confirmation?code=${encodeURIComponent(res.orderCode)}`);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
      <p className="eyebrow">{dict.checkout.eyebrow}</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">
        {dict.checkout.title}
      </h1>

      <Stepper step={step} dict={dict} />

      <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          {step === 1 && (
            <Card title={dict.checkout.step1_title}>
              <Field label={dict.checkout.full_name}>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input"
                  placeholder=""
                  autoFocus
                />
              </Field>
              <Field label={dict.checkout.phone}>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input"
                  placeholder="+255…"
                  inputMode="tel"
                />
              </Field>
              <Field label={dict.checkout.email_optional}>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="input"
                />
              </Field>
              <NavBtns
                onBack={() => router.push(`/${lang}/cart`)}
                onNext={() => setStep(2)}
                nextDisabled={!canAdvance1}
                backLabel={dict.cart.title}
                nextLabel={dict.checkout.next}
              />
            </Card>
          )}

          {step === 2 && (
            <Card title={dict.checkout.step2_title}>
              <div>
                <p className="text-sm font-medium">{dict.checkout.delivery_zone}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {zones.map((z) => (
                    <label
                      key={z.id}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border px-5 py-4 transition-colors ${
                        deliveryZoneId === z.id
                          ? "border-accent bg-accent-soft"
                          : "border-border hover:bg-surface-muted"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={deliveryZoneId === z.id}
                          onChange={() => setDeliveryZoneId(z.id)}
                          className="h-4 w-4 accent-accent"
                        />
                        <span className="text-sm font-medium">{z.name}</span>
                      </span>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {dict.common.currency} {formatTSh(z.fee_tsh)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <Field label={dict.checkout.address}>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder={dict.checkout.address_placeholder}
                />
              </Field>
              <Field label={dict.checkout.notes}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="input resize-none"
                />
              </Field>
              <NavBtns
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                nextDisabled={!canAdvance2}
                backLabel={dict.checkout.back}
                nextLabel={dict.checkout.next}
              />
            </Card>
          )}

          {step === 3 && (
            <Card title={dict.checkout.step3_title}>
              <div className="flex flex-col gap-3">
                <PaymentOption
                  selected={paymentMethod === "mpesa"}
                  onClick={() => setPaymentMethod("mpesa")}
                  icon={<Smartphone className="h-5 w-5" />}
                  title="M-Pesa"
                  desc={dict.checkout.mpesa_desc}
                />
                <PaymentOption
                  selected={paymentMethod === "card_placeholder"}
                  onClick={() => setPaymentMethod("card_placeholder")}
                  icon={<CreditCard className="h-5 w-5" />}
                  title={dict.checkout.card}
                  desc={dict.checkout.card_coming_soon}
                  disabled
                />
              </div>
              {error && (
                <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {error}
                </p>
              )}
              <NavBtns
                onBack={() => setStep(2)}
                onNext={submit}
                nextDisabled={!canSubmit || submitting || paymentMethod === "card_placeholder"}
                backLabel={dict.checkout.back}
                nextLabel={submitting ? dict.checkout.placing : dict.checkout.place_order}
              />
            </Card>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-28 rounded-2xl border border-border bg-surface-muted p-7">
            <p className="eyebrow">{dict.cart.summary}</p>
            <ul className="mt-5 space-y-3">
              {items.map((it) => (
                <li key={it.productId} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{it.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.sku} · ×{it.quantity}
                    </p>
                  </div>
                  <p className="whitespace-nowrap tabular-nums">
                    {dict.common.currency} {formatTSh(it.unitPriceTsh * it.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
              <Row label={dict.cart.subtotal} value={`${dict.common.currency} ${formatTSh(subtotal)}`} />
              <Row
                label={dict.checkout.delivery}
                value={
                  zone ? `${dict.common.currency} ${formatTSh(zone.fee_tsh)}` : "—"
                }
              />
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-border pt-5">
              <span className="text-base font-medium">{dict.cart.total}</span>
              <span className="font-display text-2xl tabular-nums">
                {dict.common.currency} {formatTSh(total)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Stepper({ step, dict }: { step: Step; dict: Dictionary }) {
  const steps = [
    dict.checkout.step1_short,
    dict.checkout.step2_short,
    dict.checkout.step3_short,
  ];
  return (
    <ol className="mt-10 flex items-center gap-3 text-sm">
      {steps.map((label, i) => {
        const n = (i + 1) as Step;
        const active = n === step;
        const done = n < step;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                active
                  ? "bg-foreground text-background"
                  : done
                    ? "bg-accent text-accent-foreground"
                    : "border border-border text-muted-foreground"
              }`}
            >
              {n}
            </span>
            <span
              className={
                active ? "font-medium" : "text-muted-foreground"
              }
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-2 h-px w-8 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border p-7">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-6 flex flex-col gap-5">{children}</div>
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

function PaymentOption({
  selected,
  onClick,
  icon,
  title,
  desc,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${
        selected
          ? "border-accent bg-accent-soft"
          : "border-border hover:bg-surface-muted"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground">
        {icon}
      </span>
      <span className="flex-1">
        <span className="text-base font-medium">{title}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}

function NavBtns({
  onBack,
  onNext,
  nextDisabled,
  backLabel,
  nextLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  backLabel: string;
  nextLabel: string;
}) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-border-strong disabled:text-muted-foreground"
      >
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
