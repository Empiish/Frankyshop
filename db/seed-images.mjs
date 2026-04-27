#!/usr/bin/env node
// Add product-relevant placeholder photos using real Unsplash CDN images.
// Hand-picked per category — thermos products show thermos photos,
// cutlery shows cutlery, dishes show plates/bowls/thali.
// Customer replaces with their own via the admin upload UI.
//
// Idempotent: clears any prior placeholder rows
// (URLs from picsum.photos, dummyimage.com, or images.unsplash.com)
// before inserting.

import postgres from "postgres";

const url = process.env.DATABASE_URL ?? process.env.DATANEXUS_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(url, { prepare: false, max: 1 });

// Unsplash photo IDs hand-picked from search; all CC0 / unsplash license.
const P = {
  flask_grass: "1592985666128-a89274277995",     // black/white vacuum flask on grass
  flask_hand:  "1605539582747-ce302b9afca2",     // person holding stainless steel flask
  spoon:       "1616080854961-4b4f601f3545",     // stainless steel spoon on white plate
  silverware:  "1525182461131-614d0df14944",     // silverware on container
  forks_white: "1550852629-7369ada867a9",        // stainless steel forks on white
  forks_black: "1584948447649-f0b6e8d19f68",     // stainless steel forks on black
  thali:       "1742281257687-092746ad6021",     // indian thali with side dishes
  bowl:        "1593143303977-01da2fd61984",     // egg beside stainless steel bowl
};

// Image URL for an Unsplash photo with consistent dimensions and crop.
const url800 = (id, crop = "entropy") =>
  `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&crop=${crop}&auto=format&q=80`;

// 4 photos per product. First entry is the hero (used in catalog tiles).
const SKU_IMAGES = {
  // Thermos & flasks
  "FK-TH-001": [P.flask_grass, P.flask_hand, P.flask_grass, P.flask_hand],
  "FK-TH-002": [P.flask_hand, P.flask_grass, P.flask_hand, P.flask_grass],
  "FK-TH-003": [P.flask_grass, P.flask_hand, P.flask_grass, P.flask_hand],

  // Cutlery
  "FK-CT-001": [P.spoon, P.silverware, P.forks_white, P.forks_black],
  "FK-CT-002": [P.silverware, P.spoon, P.forks_black, P.forks_white],
  "FK-CT-003": [P.forks_white, P.forks_black, P.silverware, P.spoon],

  // Dishes & plates
  "FK-DS-001": [P.thali, P.bowl, P.thali, P.bowl],
  "FK-DS-002": [P.thali, P.bowl, P.thali, P.bowl],
  "FK-DS-003": [P.bowl, P.thali, P.bowl, P.thali],
  "FK-DS-004": [P.silverware, P.thali, P.bowl, P.forks_white],
};

const CROPS = ["entropy", "center", "top", "edges"];

try {
  // Drop previous placeholder rows so a re-run picks up the new strategy.
  const cleared = await sql`
    delete from product_images
    where storage_path like 'https://dummyimage.com/%'
       or storage_path like 'https://picsum.photos/%'
       or storage_path like 'https://images.unsplash.com/%'
    returning id
  `;
  if (cleared.length > 0) {
    console.log(`Cleared ${cleared.length} previous placeholder image(s).`);
  }

  // Re-insert for every product whose SKU we have a mapping for AND has no images.
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
    const ids = SKU_IMAGES[p.sku];
    if (!ids) {
      console.log(`⚠ ${p.sku} (${p.name_en}) — no mapping; skipping.`);
      continue;
    }
    for (let i = 0; i < ids.length; i++) {
      const photoUrl = url800(ids[i], CROPS[i % CROPS.length]);
      await sql`
        insert into product_images (product_id, storage_path, alt, sort_order)
        values (${p.id}, ${photoUrl}, ${p.name_en + " — placeholder"}, ${i})
      `;
    }
    console.log(`✓ ${p.sku} ${p.name_en} (${ids.length} photos)`);
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
