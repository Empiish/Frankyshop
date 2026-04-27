"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { CategoryRow } from "@/lib/products-shared";
import { createProduct, updateProduct, deleteProduct } from "@/app/admin/products/actions";

export type ProductFormDefaults = {
  id?: string;
  sku?: string;
  slug?: string;
  category_id?: string | null;
  name_en?: string;
  name_sw?: string;
  name_hi?: string;
  description_en?: string;
  description_sw?: string;
  description_hi?: string;
  selling_techniques_en?: string;
  selling_techniques_sw?: string;
  selling_techniques_hi?: string;
  price_tsh?: number;
  stock?: number;
  is_active?: boolean;
  is_featured?: boolean;
  wholesale_tiers_text?: string;
  image_urls_text?: string;
};

export function ProductForm({
  defaults,
  categories,
}: {
  defaults: ProductFormDefaults;
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(defaults.id);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = isEdit
        ? await updateProduct(defaults.id!, formData)
        : await createProduct(formData);
      if (res && res.ok === false) setError(res.error);
    });
  }

  function onDelete() {
    if (!isEdit) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteProduct(defaults.id!);
    });
  }

  return (
    <form action={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card title="Basics">
          <Field label="SKU" hint="Unique product code, e.g. FK-TH-007">
            <input name="sku" defaultValue={defaults.sku} required className="input" />
          </Field>
          <Field label="URL slug" hint="lowercase-with-hyphens. Used in /products/<slug>">
            <input name="slug" defaultValue={defaults.slug} required className="input" />
          </Field>
          <Field label="Category">
            <select name="category_id" defaultValue={defaults.category_id ?? ""} className="input">
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_en}</option>
              ))}
            </select>
          </Field>
        </Card>

        <Card title="Names">
          <Field label="Name (English)">
            <input name="name_en" defaultValue={defaults.name_en} required className="input" />
          </Field>
          <Field label="Name (Swahili)">
            <input name="name_sw" defaultValue={defaults.name_sw} className="input" />
          </Field>
          <Field label="Name (Hindi)">
            <input name="name_hi" defaultValue={defaults.name_hi} className="input" />
          </Field>
        </Card>

        <Card title="Description">
          <Field label="Description (English)">
            <textarea name="description_en" defaultValue={defaults.description_en} rows={3} className="input" />
          </Field>
          <Field label="Description (Swahili)">
            <textarea name="description_sw" defaultValue={defaults.description_sw} rows={3} className="input" />
          </Field>
          <Field label="Description (Hindi)">
            <textarea name="description_hi" defaultValue={defaults.description_hi} rows={3} className="input" />
          </Field>
        </Card>

        <Card title="Selling notes (shown on product page)">
          <Field label="Notes (English)" hint="Pairing ideas, care tips, why we picked it.">
            <textarea name="selling_techniques_en" defaultValue={defaults.selling_techniques_en} rows={3} className="input" />
          </Field>
          <Field label="Notes (Swahili)">
            <textarea name="selling_techniques_sw" defaultValue={defaults.selling_techniques_sw} rows={3} className="input" />
          </Field>
          <Field label="Notes (Hindi)">
            <textarea name="selling_techniques_hi" defaultValue={defaults.selling_techniques_hi} rows={3} className="input" />
          </Field>
        </Card>

        <Card title="Images">
          <Field
            label="Image URLs"
            hint="One per line. Paste URLs to product photos hosted anywhere (Cloudinary, Imgur, your CDN). Direct file upload arrives soon."
          >
            <textarea
              name="image_urls"
              defaultValue={defaults.image_urls_text}
              rows={4}
              className="input font-mono text-xs"
              placeholder="https://example.com/photo-1.jpg&#10;https://example.com/photo-2.jpg"
            />
          </Field>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Pricing & stock">
          <Field label="Price (TSh)">
            <input
              name="price_tsh"
              type="number"
              min={0}
              step={500}
              defaultValue={defaults.price_tsh ?? 0}
              required
              className="input"
            />
          </Field>
          <Field label="Stock count">
            <input
              name="stock"
              type="number"
              min={0}
              step={1}
              defaultValue={defaults.stock ?? 0}
              required
              className="input"
            />
          </Field>
        </Card>

        <Card title="Wholesale tiers">
          <Field
            label="Tier table"
            hint="One per line, format: min_qty:price_tsh (e.g. 3:33000). Leave empty for none."
          >
            <textarea
              name="wholesale_tiers"
              defaultValue={defaults.wholesale_tiers_text}
              rows={3}
              className="input font-mono text-xs"
              placeholder="3:33000&#10;10:31000"
            />
          </Field>
        </Card>

        <Card title="Visibility">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={defaults.is_active ?? true} className="h-4 w-4 accent-accent" />
            Active (visible on storefront)
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="is_featured" defaultChecked={defaults.is_featured ?? false} className="h-4 w-4 accent-accent" />
            Featured (appears on landing page)
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
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
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
              Delete product
            </button>
          )}
        </div>

        {isEdit && defaults.id && (
          <p className="text-center text-xs text-muted-foreground">
            <Link href={`/en/products/${defaults.slug}`} target="_blank" className="hover:text-accent">
              View on storefront →
            </Link>
          </p>
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
