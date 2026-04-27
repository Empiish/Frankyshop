"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart, cartCount } from "@/stores/cart";

export function CartIndicator({
  href,
  ariaLabel,
}: {
  href: string;
  ariaLabel: string;
}) {
  const items = useCart((s) => s.items);
  const n = cartCount(items);
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted"
    >
      <ShoppingBag className="h-4 w-4" />
      {n > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground">
          {n}
        </span>
      )}
    </Link>
  );
}
