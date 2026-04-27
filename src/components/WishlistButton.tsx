"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlist } from "@/app/[lang]/account/wishlist/actions";

export function WishlistButton({
  productId,
  initialInWishlist,
  isLoggedIn,
  lang,
  labels,
}: {
  productId: string;
  initialInWishlist: boolean;
  isLoggedIn: boolean;
  lang: string;
  labels: { saved: string; save: string; sign_in_required: string };
}) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [pending, startTransition] = useTransition();
  const [tooltip, setTooltip] = useState<string | null>(null);

  function onClick() {
    if (!isLoggedIn) {
      router.push(`/${lang}/account/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setTooltip(null);
    startTransition(async () => {
      const res = await toggleWishlist(productId);
      if (res.ok) setInWishlist(res.inWishlist);
      else setTooltip(res.error);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={inWishlist}
        aria-label={inWishlist ? labels.saved : labels.save}
        className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
          inWishlist
            ? "border-accent bg-accent-soft text-accent"
            : "border-border bg-background hover:bg-surface-muted"
        }`}
      >
        <Heart className={`h-4 w-4 ${inWishlist ? "fill-accent" : ""}`} />
      </button>
      {tooltip && (
        <span className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background">
          {tooltip}
        </span>
      )}
    </div>
  );
}
