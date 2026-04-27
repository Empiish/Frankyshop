#!/usr/bin/env node
// Add deterministic Picsum placeholder photos to every product that has none.
// Idempotent — skips products that already have at least one image.

import postgres from "postgres";

const url = process.env.DATABASE_URL ?? process.env.DATANEXUS_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(url, { prepare: false, max: 1 });

// 4 photos per product, keyed off the SKU so they're stable across runs.
function urlsFor(sku, count = 4) {
  return Array.from({ length: count }, (_, i) =>
    `https://picsum.photos/seed/${encodeURIComponent(sku)}-${i}/800/1000`,
  );
}

try {
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
    const urls = urlsFor(p.sku);
    for (let i = 0; i < urls.length; i++) {
      await sql`
        insert into product_images (product_id, storage_path, alt, sort_order)
        values (${p.id}, ${urls[i]}, ${p.name_en + " — placeholder"}, ${i})
      `;
    }
    console.log(`✓ ${p.sku} ${p.name_en} (${urls.length} images)`);
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
