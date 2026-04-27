#!/usr/bin/env node
// Add product-relevant placeholder photos.
// Strategy: brand-colored SVG-text mockups that clearly say what the product is —
// not random scenery. Customer replaces with real photos via the admin upload UI.
// Idempotent: clears any previous placeholder rows (storage_path starts with
// "https://dummyimage.com/" or "https://picsum.photos/") before inserting.

import postgres from "postgres";

const url = process.env.DATABASE_URL ?? process.env.DATANEXUS_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(url, { prepare: false, max: 1 });

// Cycle through 4 brand-coordinated background/foreground pairs so a product's
// gallery has visual variety while staying on-brand.
const PALETTES = [
  { bg: "c2410c", fg: "ffffff", label: "terracotta" }, // primary accent
  { bg: "0c0a09", fg: "fafaf9", label: "stone-950"  }, // foreground
  { bg: "f7f3ee", fg: "1c1917", label: "warm-cream" }, // soft surface
  { bg: "9a3412", fg: "fdf4ed", label: "deep-clay"  }, // accent-hover
];

// Map SKU prefix → short product label shown on the mockup tile.
function shortLabel(name) {
  // Strip "Set", parens, etc. — keep it tight; max ~22 chars.
  return name.replace(/\s*\(.+\)/, "").slice(0, 28);
}

function mockupUrl(name, paletteIdx, totalIdx) {
  const palette = PALETTES[paletteIdx % PALETTES.length];
  const text = encodeURIComponent(`${shortLabel(name)}\nMockup ${totalIdx + 1}`);
  return `https://dummyimage.com/800x1000/${palette.bg}/${palette.fg}.png&text=${text}`;
}

try {
  // Drop previous placeholder rows so a re-run picks up the new strategy.
  const cleared = await sql`
    delete from product_images
    where storage_path like 'https://dummyimage.com/%'
       or storage_path like 'https://picsum.photos/%'
    returning id
  `;
  if (cleared.length > 0) {
    console.log(`Cleared ${cleared.length} previous placeholder image(s).`);
  }

  // Re-insert for any product that now has zero images.
  const products = await sql`
    select p.id, p.sku, p.name_en
    from products p
    where not exists (select 1 from product_images pi where pi.product_id = p.id)
    order by p.created_at asc
  `;
  if (products.length === 0) {
    console.log("All products already have images. Nothing to do.");
    process.exit(0);
  }
  for (const p of products) {
    for (let i = 0; i < 4; i++) {
      const url = mockupUrl(p.name_en, i, i);
      await sql`
        insert into product_images (product_id, storage_path, alt, sort_order)
        values (${p.id}, ${url}, ${p.name_en + " — mockup placeholder"}, ${i})
      `;
    }
    console.log(`✓ ${p.sku} ${p.name_en}`);
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
