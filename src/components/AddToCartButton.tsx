"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/stores/cart";

export function AddToCartButton({
  product,
  labels,
}: {
  product: {
    productId: string;
    sku: string;
    slug: string;
    name: string;
    unitPriceTsh: number;
    stock: number;
  };
  labels: { add: string; added: string; out_of_stock: string };
}) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const disabled = product.stock <= 0;

  function handleAdd() {
    add(
      {
        productId: product.productId,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        unitPriceTsh: product.unitPriceTsh,
      },
      qty,
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex h-12 w-fit items-center rounded-full border border-border">
        <button
          type="button"
          onClick={() => setQty(Math.max(1, qty - 1))}
          aria-label="Decrease"
          className="flex h-12 w-10 items-center justify-center text-lg hover:text-accent"
        >
          −
        </button>
        <span className="w-8 text-center text-base font-medium tabular-nums">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
          aria-label="Increase"
          className="flex h-12 w-10 items-center justify-center text-lg hover:text-accent"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className="group inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-border-strong disabled:text-muted-foreground"
      >
        {disabled ? (
          labels.out_of_stock
        ) : justAdded ? (
          <>
            <Check className="h-4 w-4" />
            {labels.added}
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            {labels.add}
          </>
        )}
      </button>
    </div>
  );
}
