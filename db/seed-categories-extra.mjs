#!/usr/bin/env node
// Add cookware / kitchen-tools / cleaning categories plus a few starter
// products in each, so the circular category nav has 7 niche-relevant
// tiles instead of 4. Idempotent — uses slug + sku uniqueness.

import postgres from "postgres";

const url = process.env.DATABASE_URL ?? process.env.DATANEXUS_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(url, { prepare: false, max: 1 });

const DJ = (slug, n = 1) =>
  `https://cdn.dummyjson.com/product-images/kitchen-accessories/${slug}/${n}.webp`;
const UNSPL = (id, crop = "entropy") =>
  `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&crop=${crop}&auto=format&q=80`;

const CATEGORIES = [
  {
    slug: "cookware",
    name_en: "Cookware",
    name_sw: "Vyombo vya kupikia",
    name_hi: "कुकवेयर",
    sort_order: 5,
  },
  {
    slug: "tools",
    name_en: "Kitchen tools",
    name_sw: "Vifaa vya jiko",
    name_hi: "रसोई के उपकरण",
    sort_order: 6,
  },
  {
    slug: "cleaning",
    name_en: "Cleaning",
    name_sw: "Usafi",
    name_hi: "सफाई",
    sort_order: 7,
  },
];

const PRODUCTS = [
  // Cookware
  {
    sku: "FK-CW-001", slug: "carbon-steel-wok-30cm", category_slug: "cookware",
    name_en: "Carbon Steel Wok 30cm", name_sw: "Karai ya chuma 30cm", name_hi: "कार्बन स्टील वॉक 30cm",
    description_en: "Pre-seasoned carbon steel wok. Heats fast, holds heat, lasts a lifetime.",
    price_tsh: 32000, stock: 25, is_featured: true,
    images: [DJ("carbon-steel-wok", 1), DJ("carbon-steel-wok", 2), DJ("carbon-steel-wok", 3)],
  },
  {
    sku: "FK-CW-002", slug: "stainless-pot-glass-lid-4l", category_slug: "cookware",
    name_en: "Stainless Pot with Glass Lid 4L", name_sw: "Sufuria ya chuma 4L na kifuniko",
    description_en: "Heavy-base 4-litre stainless pot. Tempered glass lid lets you watch the rice.",
    price_tsh: 38000, stock: 20, is_featured: false,
    images: [DJ("silver-pot-with-glass-cap", 1), DJ("silver-pot-with-glass-cap", 2), DJ("silver-pot-with-glass-cap", 3)],
  },
  {
    sku: "FK-CW-003", slug: "frying-pan-26cm", category_slug: "cookware",
    name_en: "Frying Pan 26cm", name_sw: "Sufuria ya kukaanga 26cm",
    description_en: "Everyday frying pan with a comfortable handle and even heat.",
    price_tsh: 22000, stock: 35, is_featured: false,
    images: [DJ("pan", 1), DJ("pan", 2), DJ("pan", 3)],
  },

  // Kitchen tools
  {
    sku: "FK-KT-001", slug: "bamboo-chopping-board", category_slug: "tools",
    name_en: "Bamboo Chopping Board", name_sw: "Ubao wa kukatia",
    description_en: "Hard bamboo chopping board, gentle on knives.",
    price_tsh: 7500, stock: 60, is_featured: true,
    images: [DJ("chopping-board", 1), DJ("chopping-board", 2), DJ("chopping-board", 3)],
  },
  {
    sku: "FK-KT-002", slug: "black-whisk", category_slug: "tools",
    name_en: "Black Whisk", name_sw: "Kifaa cha kuchanganya",
    description_en: "Silicone-coated balloon whisk — quiet on coated pans.",
    price_tsh: 4500, stock: 80, is_featured: false,
    images: [DJ("black-whisk", 1), DJ("black-whisk", 2), DJ("black-whisk", 3)],
  },
  {
    sku: "FK-KT-003", slug: "fine-mesh-strainer", category_slug: "tools",
    name_en: "Fine Mesh Strainer", name_sw: "Chujio cha kunyoosha",
    description_en: "Tight stainless mesh — flour, tea, soup, all easy.",
    price_tsh: 5500, stock: 70, is_featured: false,
    images: [DJ("fine-mesh-strainer", 1), DJ("fine-mesh-strainer", 2), DJ("fine-mesh-strainer", 3)],
  },
];

try {
  const catIdBySlug = new Map();
  for (const c of CATEGORIES) {
    const [{ id }] = await sql`
      insert into categories (slug, name_en, name_sw, name_hi, sort_order)
      values (${c.slug}, ${c.name_en}, ${c.name_sw}, ${c.name_hi}, ${c.sort_order})
      on conflict (slug) do update set
        name_en = excluded.name_en,
        name_sw = excluded.name_sw,
        name_hi = excluded.name_hi,
        sort_order = excluded.sort_order
      returning id
    `;
    catIdBySlug.set(c.slug, id);
    console.log(`✓ category "${c.slug}"`);
  }

  // Move the wash basin from plastic to cleaning (better fit).
  const cleaningId = catIdBySlug.get("cleaning");
  await sql`update products set category_id = ${cleaningId} where sku = 'FK-PL-003'`;

  for (const p of PRODUCTS) {
    const catId = catIdBySlug.get(p.category_slug);
    const existing = await sql`select id from products where sku = ${p.sku}`;
    let productId;
    if (existing.length > 0) {
      productId = existing[0].id;
      await sql`update products set category_id = ${catId} where id = ${productId}`;
      console.log(`= ${p.sku} ${p.name_en}`);
    } else {
      const [{ id }] = await sql`
        insert into products (
          sku, slug, category_id,
          name_en, name_sw,
          description_en,
          price_tsh, stock, is_active, is_featured
        ) values (
          ${p.sku}, ${p.slug}, ${catId},
          ${p.name_en}, ${p.name_sw ?? null},
          ${p.description_en},
          ${p.price_tsh}, ${p.stock}, true, ${p.is_featured}
        )
        returning id
      `;
      productId = id;
      console.log(`+ ${p.sku} ${p.name_en}`);
    }

    await sql`
      delete from product_images
      where product_id = ${productId} and (
        storage_path like 'https://dummyimage.com/%' or
        storage_path like 'https://picsum.photos/%' or
        storage_path like 'https://images.unsplash.com/%' or
        storage_path like 'https://cdn.dummyjson.com/%'
      )
    `;
    for (let i = 0; i < p.images.length; i++) {
      await sql`
        insert into product_images (product_id, storage_path, alt, sort_order)
        values (${productId}, ${p.images[i]}, ${p.name_en + " — placeholder"}, ${i})
      `;
    }
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
