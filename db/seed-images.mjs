#!/usr/bin/env node
// Hand-picked Unsplash CDN photos. White-background / catalog-style shots
// take the first slot (the tile that shows on the catalog grid), with a
// few lifestyle shots in the remaining gallery slots for variety.
// Customer replaces with their own via the admin upload UI when ready.

import postgres from "postgres";

const url = process.env.DATABASE_URL ?? process.env.DATANEXUS_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(url, { prepare: false, max: 1 });

// Unsplash photo IDs. License: free for commercial use, no attribution required.
const P = {
  // Thermos / vacuum flask
  tumbler_white:    "1544003484-3cd181d17917",  // black Mizu tumbler on WHITE backdrop ★
  flask_cookies:    "1610399809302-f1dd7ec33187",// flask beside cookies on wood
  flask_hand:       "1605539582747-ce302b9afca2",// person holding stainless flask
  flask_grass:      "1592985666128-a89274277995",// flask on grass
  // Cutlery
  spoon_white:      "1608068811588-3a67006b7489",// stainless spoon on WHITE surface ★
  silverware_box:   "1525182461131-614d0df14944",// silverware in container
  forks_white:      "1550852629-7369ada867a9",   // forks on WHITE bg ★
  forks_black:      "1584948447649-f0b6e8d19f68",// forks on black bg
  // Dishes
  plates_white:     "1462015679637-c0c320830925",// pile of white ceramic plates ★
  bowl_tray:        "1624895672076-adeb9a79c589",// steel bowl on WHITE ceramic tray ★
  bowl_egg:         "1593143303977-01da2fd61984",// egg beside steel bowl
  thali:            "1742281257687-092746ad6021",// Indian thali with side dishes
};

// Always lead with a clean / white-bg shot (★) — that's the tile customers
// see in the catalog grid. Secondary slots can be lifestyle/context.
const SKU_IMAGES = {
  // Thermos & flasks — silver-tumbler-on-white as hero
  "FK-TH-001": [P.tumbler_white, P.flask_grass,  P.flask_hand,    P.flask_cookies],
  "FK-TH-002": [P.tumbler_white, P.flask_hand,   P.flask_grass,   P.flask_cookies],
  "FK-TH-003": [P.tumbler_white, P.flask_grass,  P.flask_cookies, P.flask_hand],

  // Cutlery — spoon-on-white as hero for spoon SKUs, fork-on-white for fork SKU
  "FK-CT-001": [P.spoon_white,   P.silverware_box, P.forks_white,  P.forks_black],
  "FK-CT-002": [P.spoon_white,   P.silverware_box, P.forks_white,  P.forks_black],
  "FK-CT-003": [P.forks_white,   P.forks_black,    P.spoon_white,  P.silverware_box],

  // Dishes & plates
  "FK-DS-001": [P.plates_white,  P.thali,          P.bowl_tray,    P.bowl_egg],
  "FK-DS-002": [P.thali,         P.plates_white,   P.bowl_tray,    P.bowl_egg],
  "FK-DS-003": [P.bowl_tray,     P.bowl_egg,       P.plates_white, P.thali],
  "FK-DS-004": [P.silverware_box, P.plates_white,  P.spoon_white,  P.forks_white],
};

const url800 = (id, crop = "entropy") =>
  `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&crop=${crop}&auto=format&q=80`;

const CROPS = ["entropy", "center", "edges", "top"];

try {
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
    console.log(`✓ ${p.sku} ${p.name_en}`);
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
