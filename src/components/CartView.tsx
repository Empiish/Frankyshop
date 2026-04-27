"use client";

import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCart, cartSubtotal } from "@/stores/cart";
import { formatTSh } from "@/lib/utils";

export function CartView({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const subtotal = cartSubtotal(items);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-muted-foreground">{dict.common.loading}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="eyebrow">{dict.cart.eyebrow}</p>
        <h1 className="font-display mt-4 text-4xl tracking-tight sm:text-5xl">
          {dict.cart.empty_title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {dict.cart.empty_subtitle}
        </p>
        <Link
          href={`/${lang}/products`}
          className="group mt-10 inline-flex items-center gap-2 text-base font-medium"
        >
          <span className="border-b border-foreground pb-1 transition-colors group-hover:border-accent group-hover:text-accent">
            {dict.cart.empty_cta}
          </span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
      <p className="eyebrow">{dict.cart.eyebrow}</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">
        {dict.cart.title}
      </h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <ul className="divide-y divide-border lg:col-span-8">
          {items.map((it) => (
            <li
              key={it.productId}
              className="flex items-start gap-5 py-6 first:pt-0"
            >
              <Link
                href={`/${lang}/products/${it.slug}`}
                className="aspect-square w-24 shrink-0 overflow-hidden rounded-2xl product-tile-gradient-1"
              />
              <div className="flex-1">
                <Link
                  href={`/${lang}/products/${it.slug}`}
                  className="text-base font-medium hover:text-accent"
                >
                  {it.name}
                </Link>
                <p className="mt-1 text-xs tracking-wider text-muted-foreground">
                  {it.sku}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-9 items-center rounded-full border border-border">
                    <button
                      type="button"
                      onClick={() => setQuantity(it.productId, it.quantity - 1)}
                      aria-label="Decrease"
                      className="flex h-9 w-8 items-center justify-center hover:text-accent"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-medium tabular-nums">
                      {it.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(it.productId, it.quantity + 1)}
                      aria-label="Increase"
                      className="flex h-9 w-8 items-center justify-center hover:text-accent"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(it.productId)}
                    aria-label={dict.cart.remove}
                    className="text-muted-foreground transition-colors hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="whitespace-nowrap text-base font-medium tabular-nums">
                {dict.common.currency} {formatTSh(it.unitPriceTsh * it.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="lg:col-span-4">
          <div className="rounded-2xl border border-border bg-surface-muted p-7">
            <p className="eyebrow">{dict.cart.summary}</p>
            <div className="mt-5 flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">{dict.cart.subtotal}</span>
              <span className="font-medium tabular-nums">
                {dict.common.currency} {formatTSh(subtotal)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">{dict.cart.delivery_at_checkout}</span>
            </div>
            <div className="mt-5 border-t border-border pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-medium">{dict.cart.total}</span>
                <span className="font-display text-2xl tabular-nums">
                  {dict.common.currency} {formatTSh(subtotal)}
                </span>
              </div>
            </div>
            <Link
              href={`/${lang}/checkout`}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:bg-accent"
            >
              {dict.cart.checkout_cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
