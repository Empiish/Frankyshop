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

// Hero (slot 0) is what shows on catalog tiles — always the cleanest shot.
const SKU_IMAGES = {
  // Thermos & flasks — DummyJSON has no thermos; use Unsplash silver tumbler on white.
  "FK-TH-001": [UNSPL("1544003484-3cd181d17917"), UNSPL("1544003484-3cd181d17917","center"), UNSPL("1544003484-3cd181d17917","edges"), UNSPL("1544003484-3cd181d17917","top")],
  "FK-TH-002": [UNSPL("1544003484-3cd181d17917"), UNSPL("1544003484-3cd181d17917","center"), UNSPL("1544003484-3cd181d17917","edges"), UNSPL("1544003484-3cd181d17917","top")],
  "FK-TH-003": [UNSPL("1544003484-3cd181d17917"), UNSPL("1544003484-3cd181d17917","center"), UNSPL("1544003484-3cd181d17917","edges"), UNSPL("1544003484-3cd181d17917","top")],

  // Cutlery
  "FK-CT-001": [DJ("spoon", 1), DJ("spoon", 2), DJ("spoon", 3), DJ_THUMB("spoon")],
  "FK-CT-002": [DJ("spoon", 1), DJ("spoon", 2), DJ("spoon", 3), DJ_THUMB("spoon")],
  "FK-CT-003": [DJ("fork",  1), DJ("fork",  2), DJ("fork",  3), DJ_THUMB("fork")],

  // Dishes
  "FK-DS-001": [DJ("plate", 1), DJ("plate", 2), DJ("plate", 3), DJ_THUMB("plate")],
  "FK-DS-002": [DJ("plate", 1), DJ("plate", 2), DJ_THUMB("plate"), DJ("plate", 3)],
  "FK-DS-003": [DJ("plate", 1), DJ("plate", 2), DJ_THUMB("plate"), DJ("plate", 3)],
  "FK-DS-004": [DJ("plate", 1), DJ("spoon", 1), DJ("fork", 1),     DJ("knife", 1)],

  // Plastic & storage
  "FK-PL-001": [DJ("spoon", 1), DJ("spoon", 2), DJ("spoon", 3), DJ_THUMB("spoon")],
  "FK-PL-002": [DJ("lunch-box", 1), DJ("lunch-box", 2), DJ_THUMB("lunch-box"), DJ("lunch-box", 3)],
  "FK-PL-003": [UNSPL("1625562105495-7bca79bbec51"), UNSPL("1625562105495-7bca79bbec51","center"), UNSPL("1625562105495-7bca79bbec51","edges"), UNSPL("1625562105495-7bca79bbec51","top")],
  "FK-PL-004": [DJ("glass", 1), DJ("glass", 2), DJ_THUMB("glass"), DJ("glass", 3)],
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
