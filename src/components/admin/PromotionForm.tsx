"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { CategoryRow } from "@/lib/products-shared";
import { createPromotion, updatePromotion, deletePromotion } from "@/app/admin/promotions/actions";

export type PromotionFormDefaults = {
  id?: string;
  code?: string;
  name_en?: string;
  name_sw?: string;
  name_hi?: string;
  type?: "percent_off" | "fixed_off" | "bogo";
  value?: number;
  starts_at?: string; // datetime-local format YYYY-MM-DDTHH:mm
  ends_at?: string;
  applies_to_category_id?: string | null;
  applies_to_product_id?: string | null;
  is_active?: boolean;
};

type ProductOption = { id: string; name_en: string; sku: string };

export function PromotionForm({
  defaults,
  categories,
  products,
}: {
  defaults: PromotionFormDefaults;
  categories: CategoryRow[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(defaults.id);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = isEdit
        ? await updatePromotion(defaults.id!, formData)
        : await createPromotion(formData);
      if (res && res.ok === false) setError(res.error);
    });
  }

  function onDelete() {
    if (!isEdit) return;
    if (!confirm("Delete this promotion?")) return;
    startTransition(async () => {
      await deletePromotion(defaults.id!);
    });
  }

  return (
    <form action={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card title="Promotion">
          <Field label="Internal name (English)" hint="What you'll see in the admin list. Customers don't see this directly.">
            <input name="name_en" defaultValue={defaults.name_en} required className="input" />
          </Field>
          <Field label="Name (Swahili)">
            <input name="name_sw" defaultValue={defaults.name_sw} className="input" />
          </Field>
          <Field label="Name (Hindi)">
            <input name="name_hi" defaultValue={defaults.name_hi} className="input" />
          </Field>
          <Field label="Code (optional)" hint="Shoppers enter this at checkout. Leave blank for an automatic promotion.">
            <input name="code" defaultValue={defaults.code} className="input uppercase" />
          </Field>
        </Card>

        <Card title="Discount">
          <Field label="Type">
            <select name="type" defaultValue={defaults.type ?? "percent_off"} className="input">
              <option value="percent_off">% off</option>
              <option value="fixed_off">TSh off (fixed amount)</option>
              <option value="bogo">Buy one get one</option>
            </select>
          </Field>
          <Field label="Value" hint="For % off: a number from 1–100. For TSh off: the amount. For BOGO: leave 0.">
            <input name="value" type="number" min={0} step={1} defaultValue={defaults.value ?? 0} required className="input" />
          </Field>
        </Card>

        <Card title="Targeting">
          <Field label="Apply to category" hint="Optional. Leave empty for sitewide.">
            <select name="applies_to_category_id" defaultValue={defaults.applies_to_category_id ?? ""} className="input">
              <option value="">— Sitewide —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_en}</option>
              ))}
            </select>
          </Field>
          <Field label="Apply to one product" hint="Takes precedence over category if set.">
            <select name="applies_to_product_id" defaultValue={defaults.applies_to_product_id ?? ""} className="input">
              <option value="">— None —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name_en} · {p.sku}</option>
              ))}
            </select>
          </Field>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Schedule">
          <Field label="Starts at" hint="Optional. Leave empty to start immediately.">
            <input name="starts_at" type="datetime-local" defaultValue={defaults.starts_at ?? ""} className="input" />
          </Field>
          <Field label="Ends at" hint="Optional. Leave empty to run forever.">
            <input name="ends_at" type="datetime-local" defaultValue={defaults.ends_at ?? ""} className="input" />
          </Field>
        </Card>

        <Card title="Status">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={defaults.is_active ?? true} className="h-4 w-4 accent-accent" />
            Active
          </label>
        </Card>

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background hover:bg-accent disabled:opacity-60"
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create promotion"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/promotions")}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border text-sm hover:bg-surface-muted"
          >
            Cancel
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full text-xs text-danger hover:underline disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete promotion
            </button>
          )}
        </div>
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
