#!/usr/bin/env node
// Catalog-style placeholder photos. Mostly DummyJSON (cdn.dummyjson.com),
// which serves real e-commerce product shots on white backgrounds — the
// look the user asked for (Amazon / Williams Sonoma / IKEA-style isolated
// product photography). A handful of Unsplash white-bg shots fill the
// gaps where DummyJSON has no match.
// Customer swaps to their own photos via admin upload when ready.

import postgres from "postgres";

const url = process.env.DATABASE_URL ?? process.env.DATANEXUS_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(url, { prepare: false, max: 1 });

const DJ = (slug, n = 1) =>
  `https://cdn.dummyjson.com/product-images/kitchen-accessories/${slug}/${n}.webp`;
const DJ_THUMB = (slug) =>
  `https://cdn.dummyjson.com/product-images/kitchen-accessories/${slug}/thumbnail.webp`;
const UNSPL = (id, crop = "entropy") =>
  `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&crop=${crop}&auto=format&q=80`;

// One unique hero (slot 0) per SKU — no two products share the same hero shot.
// Slots 1..3 are extra angles/thumbnails, can repeat within a single product.
const SKU_IMAGES = {
  // Thermos & flasks — three distinct Unsplash product shots (DummyJSON has no thermos slug).
  "FK-TH-001": [UNSPL("1544003484-3cd181d17917"), UNSPL("1544003484-3cd181d17917","center"), UNSPL("1544003484-3cd181d17917","edges"), UNSPL("1544003484-3cd181d17917","top")], // silver tumbler
  "FK-TH-002": [UNSPL("1602143407151-7111542de6e8"), UNSPL("1602143407151-7111542de6e8","center"), UNSPL("1602143407151-7111542de6e8","edges"), UNSPL("1602143407151-7111542de6e8","top")], // small travel flask
  "FK-TH-003": [DJ("black-aluminium-cup", 1), DJ("black-aluminium-cup", 2), DJ("black-aluminium-cup", 3), DJ_THUMB("black-aluminium-cup")], // family thermos → black cup (vessel)

  // Cutlery — three distinct slugs / sources
  "FK-CT-001": [DJ("spoon", 1), DJ("spoon", 2), DJ("spoon", 3), DJ_THUMB("spoon")],                           // teaspoon set → DummyJSON spoon
  "FK-CT-002": [DJ("bamboo-spatula", 1), DJ("bamboo-spatula", 2), DJ("bamboo-spatula", 3), DJ_THUMB("bamboo-spatula")],                  // dinner spoon set → bamboo spatula (utensil)
  "FK-CT-003": [DJ("fork", 1),  DJ("fork", 2),  DJ("fork", 3),  DJ_THUMB("fork")],                            // fork set → DummyJSON fork

  // Dishes — four distinct sources, one per product
  "FK-DS-001": [DJ("plate", 1),     DJ("plate", 2),     DJ("plate", 3),     DJ_THUMB("plate")],               // talrikar steel plate set
  "FK-DS-002": [DJ("spice-rack", 1), DJ("spice-rack", 2), DJ("spice-rack", 3), DJ_THUMB("spice-rack")], // thali set → spice rack (condiment set)
  "FK-DS-003": [DJ("tray", 1),      DJ("tray", 2),      DJ("tray", 3),      DJ_THUMB("tray")],                // serving bowl set → tray
  "FK-DS-004": [DJ("knife", 1),     DJ("plate", 1),     DJ("spoon", 1),     DJ("fork", 1)],                   // kitchen-essentials bundle (mixed)

  // Plastic & storage — four distinct sources
  "FK-PL-001": [DJ("slotted-turner", 1), DJ("slotted-turner", 2), DJ("slotted-turner", 3), DJ_THUMB("slotted-turner")],                                                          // plastic spoon set → slotted turner (plastic utensil)
  "FK-PL-002": [DJ("lunch-box", 1), DJ("lunch-box", 2), DJ_THUMB("lunch-box"), DJ("lunch-box", 3)],            // food storage container
  "FK-PL-003": [DJ("ice-cube-tray", 1), DJ("ice-cube-tray", 2), DJ("ice-cube-tray", 3), DJ_THUMB("ice-cube-tray")],                                                              // wash basin → ice cube tray (plastic item)
  "FK-PL-004": [DJ("glass", 1),     DJ("glass", 2),     DJ_THUMB("glass"),     DJ("glass", 3)],                // plastic cup set

  // Cookware
  "FK-CW-001": [DJ("carbon-steel-wok", 1),         DJ("carbon-steel-wok", 2),         DJ("carbon-steel-wok", 3),         DJ_THUMB("carbon-steel-wok")],
  "FK-CW-002": [DJ("silver-pot-with-glass-cap", 1), DJ("silver-pot-with-glass-cap", 2), DJ("silver-pot-with-glass-cap", 3), DJ_THUMB("silver-pot-with-glass-cap")],
  "FK-CW-003": [DJ("pan", 1),                       DJ("pan", 2),                       DJ("pan", 3),                       DJ_THUMB("pan")],

  // Kitchen tools
  "FK-KT-001": [DJ("chopping-board", 1),     DJ("chopping-board", 2),     DJ("chopping-board", 3),     DJ_THUMB("chopping-board")],
  "FK-KT-002": [DJ("black-whisk", 1),        DJ("black-whisk", 2),        DJ("black-whisk", 3),        DJ_THUMB("black-whisk")],
  "FK-KT-003": [DJ("fine-mesh-strainer", 1), DJ("fine-mesh-strainer", 2), DJ("fine-mesh-strainer", 3), DJ_THUMB("fine-mesh-strainer")],
};

try {
  const cleared = await sql`
    delete from product_images
    where storage_path like 'https://dummyimage.com/%'
       or storage_path like 'https://picsum.photos/%'
       or storage_path like 'https://images.unsplash.com/%'
       or storage_path like 'https://cdn.dummyjson.com/%'
    returning id
  `;
  if (cleared.length > 0) console.log(`Cleared ${cleared.length} previous placeholder image(s).`);

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
    const urls = SKU_IMAGES[p.sku];
    if (!urls) {
      console.log(`⚠ ${p.sku} (${p.name_en}) — no mapping; skipping.`);
      continue;
    }
    for (let i = 0; i < urls.length; i++) {
      await sql`
        insert into product_images (product_id, storage_path, alt, sort_order)
        values (${p.id}, ${urls[i]}, ${p.name_en + " — placeholder"}, ${i})
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
