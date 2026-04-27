"use client";

import { useState, useTransition } from "react";
import { saveSiteContent } from "@/app/admin/content/actions";

type Defaults = {
  whatsapp_number: string;
  shop_phone: string;
  shop_lat: string;
  shop_lng: string;
  shop_address_en: string;
  shop_address_sw: string;
  shop_address_hi: string;
  shop_hours_en: string;
  shop_hours_sw: string;
  shop_hours_hi: string;
};

export function SiteContentForm({ defaults }: { defaults: Defaults }) {
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await saveSiteContent(formData);
      if (res.ok) setSavedAt(new Date().toLocaleTimeString());
      else setError(res.error);
    });
  }

  return (
    <form action={onSubmit} className="grid gap-6 lg:grid-cols-2">
      <Card title="Reach us">
        <Field label="WhatsApp number" hint="Digits only with country code, e.g. 255712345678 (no + or spaces).">
          <input name="whatsapp_number" defaultValue={defaults.whatsapp_number} required className="input" />
        </Field>
        <Field label="Shop phone" hint="As you'd like it displayed.">
          <input name="shop_phone" defaultValue={defaults.shop_phone} required className="input" />
        </Field>
      </Card>

      <Card title="Map pin">
        <Field label="Latitude" hint="Decimal degrees. Default is Kariakoo.">
          <input name="shop_lat" defaultValue={defaults.shop_lat} required className="input" />
        </Field>
        <Field label="Longitude">
          <input name="shop_lng" defaultValue={defaults.shop_lng} required className="input" />
        </Field>
      </Card>

      <Card title="Shop address">
        <Field label="English"><input name="shop_address_en" defaultValue={defaults.shop_address_en} required className="input" /></Field>
        <Field label="Swahili"><input name="shop_address_sw" defaultValue={defaults.shop_address_sw} className="input" /></Field>
        <Field label="Hindi"><input name="shop_address_hi" defaultValue={defaults.shop_address_hi} className="input" /></Field>
      </Card>

      <Card title="Opening hours">
        <Field label="English"><input name="shop_hours_en" defaultValue={defaults.shop_hours_en} required className="input" /></Field>
        <Field label="Swahili"><input name="shop_hours_sw" defaultValue={defaults.shop_hours_sw} className="input" /></Field>
        <Field label="Hindi"><input name="shop_hours_hi" defaultValue={defaults.shop_hours_hi} className="input" /></Field>
      </Card>

      <div className="lg:col-span-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-medium text-background hover:bg-accent disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {savedAt && <span className="text-xs text-muted-foreground">Saved at {savedAt}</span>}
        {error && (
          <span className="text-xs text-danger">{error}</span>
        )}
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="font-display text-xl">{title}</p>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}
