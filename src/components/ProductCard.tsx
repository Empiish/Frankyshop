import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { ProductRow } from "@/lib/products-shared";
import { localizedProductName } from "@/lib/products-shared";
import { formatTSh } from "@/lib/utils";

const tileGradients = [
  "product-tile-gradient-1",
  "product-tile-gradient-2",
  "product-tile-gradient-3",
  "product-tile-gradient-4",
];

export function ProductCard({
  product,
  lang,
  index = 0,
  currencyLabel = "TSh",
  imageUrl,
}: {
  product: ProductRow;
  lang: Locale;
  index?: number;
  currencyLabel?: string;
  imageUrl?: string | null;
}) {
  const name = localizedProductName(product, lang);
  const outOfStock = product.stock <= 0;

  return (
    <Link href={`/${lang}/products/${product.slug}`} className="group block">
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-2xl ${
          imageUrl ? "" : tileGradients[index % tileGradients.length]
        }`}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            unoptimized
          />
        )}
        {!imageUrl && (
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-medium tracking-wider text-muted-foreground backdrop-blur">
          {product.sku}
        </span>
        {outOfStock && (
          <span className="absolute right-4 top-4 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-medium tracking-wider text-background">
            SOLD OUT
          </span>
        )}
        {product.is_featured && !outOfStock && (
          <span className="absolute right-4 top-4 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-medium tracking-wider text-accent">
            FEATURED
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="text-base font-medium leading-tight transition-colors group-hover:text-accent">
          {name}
        </h3>
        <p className="whitespace-nowrap text-base font-medium tabular-nums">
          {currencyLabel} {formatTSh(product.price_tsh)}
        </p>
      </div>
    </Link>
  );
}
