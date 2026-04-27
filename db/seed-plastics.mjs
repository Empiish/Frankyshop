#!/usr/bin/env node
// Add a "Plastic & storage" category with four typical Tanzanian-houseware
// plastic items (spoon set, food container, wash basin, cup set), each with
// a hand-picked Unsplash photo as the catalog hero. Idempotent — uses
// SKU + slug uniqueness to skip rows that already exist.

import postgres from "postgres";

const url = process.env.DATABASE_URL ?? process.env.DATANEXUS_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(url, { prepare: false, max: 1 });

const PHOTOS = {
  // White-bg / clean-bg plastic shots
  fork_spoon:    "1562684785-5d6053d8fe36", // white plastic fork+spoon
  container:     "1613410666293-712a1db5956c",// person holding white plastic container
  bucket_shelf:  "1625562105495-7bca79bbec51",// white plastic bucket on white shelf
  cups_color:    "1562077981-4d7eafd44932",   // assorted color disposable cups
  white_spoon:   "1579028017684-1c828c18b5f6",// plastic utensils
};

const url800 = (id, crop = "entropy") =>
  `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&crop=${crop}&auto=format&q=80`;
const CROPS = ["entropy", "center", "edges", "top"];

const PLASTIC_CAT = {
  slug: "plastic",
  name_en: "Plastic & storage",
  name_sw: "Vifaa vya plastiki",
  name_hi: "प्लास्टिक और स्टोरेज",
  sort_order: 4,
};

const PRODUCTS = [
  {
    sku: "FK-PL-001",
    slug: "plastic-spoon-set-24",
    name_en: "Plastic Spoon Set (24)",
    name_sw: "Seti ya vijiko vya plastiki (24)",
    name_hi: "प्लास्टिक चम्मच सेट (24)",
    description_en: "Lightweight, BPA-free plastic spoons. 24-piece pack — perfect for kids' meals, picnics, and busy kitchens.",
    description_sw: "Vijiko vya plastiki vyepesi, bila BPA. Kifurushi cha vipande 24 — bora kwa watoto, safari na jiko zenye shughuli.",
    description_hi: "हल्के, BPA-मुक्त प्लास्टिक चम्मच। 24 पीस पैक — बच्चों के भोजन, पिकनिक और व्यस्त रसोई के लिए बढ़िया।",
    price_tsh: 4000,
    stock: 200,
    is_featured: false,
    images: [PHOTOS.fork_spoon, PHOTOS.white_spoon, PHOTOS.fork_spoon, PHOTOS.white_spoon],
  },
  {
    sku: "FK-PL-002",
    slug: "food-storage-container-5l",
    name_en: "Food Storage Container 5L",
    name_sw: "Chombo cha kuhifadhi chakula 5L",
    name_hi: "खाद्य भंडारण कंटेनर 5L",
    description_en: "Airtight 5-litre plastic container with snap-on lid. Stackable, dishwasher-safe.",
    description_sw: "Chombo cha plastiki cha lita 5 chenye kifuniko cha kufunga. Kinaweza kupangwa juu ya kingine, salama kwa dishwasher.",
    description_hi: "5-लीटर एयरटाइट प्लास्टिक कंटेनर, स्नैप-ऑन ढक्कन के साथ। स्टैकेबल, डिशवॉशर-सेफ़।",
    price_tsh: 12000,
    stock: 80,
    is_featured: true,
    images: [PHOTOS.container, PHOTOS.bucket_shelf, PHOTOS.container, PHOTOS.bucket_shelf],
  },
  {
    sku: "FK-PL-003",
    slug: "plastic-wash-basin-12l",
    name_en: "Plastic Wash Basin 12L",
    name_sw: "Beseni la plastiki 12L",
    name_hi: "प्लास्टिक वॉश बेसिन 12L",
    description_en: "Sturdy 12-litre plastic wash basin — laundry, dishes, the daily mop. Reinforced rim.",
    description_sw: "Beseni imara la plastiki la lita 12 — nguo, vyombo, kazi za kila siku. Mdomo wenye nguvu.",
    description_hi: "मज़बूत 12-लीटर प्लास्टिक वॉश बेसिन — कपड़े धोने, बर्तन, रोज़ की सफाई के लिए। मज़बूत किनारा।",
    price_tsh: 9500,
    stock: 65,
    is_featured: false,
    images: [PHOTOS.bucket_shelf, PHOTOS.container, PHOTOS.bucket_shelf, PHOTOS.container],
  },
  {
    sku: "FK-PL-004",
    slug: "plastic-cup-set-6",
    name_en: "Plastic Cup Set (6)",
    name_sw: "Seti ya vikombe vya plastiki (6)",
    name_hi: "प्लास्टिक कप सेट (6)",
    description_en: "Bright, kid-friendly plastic cups — 6 colours, dishwasher-safe, no BPA.",
    description_sw: "Vikombe vya plastiki vya rangi mbalimbali — rangi 6, salama kwa dishwasher, bila BPA.",
    description_hi: "चमकीले, बच्चों के अनुकूल प्लास्टिक कप — 6 रंग, डिशवॉशर-सेफ़, BPA रहित।",
    price_tsh: 6500,
    stock: 120,
    is_featured: true,
    images: [PHOTOS.cups_color, PHOTOS.cups_color, PHOTOS.cups_color, PHOTOS.cups_color],
  },
];

try {
  const [{ id: catId }] = await sql`
    insert into categories (slug, name_en, name_sw, name_hi, sort_order)
    values (${PLASTIC_CAT.slug}, ${PLASTIC_CAT.name_en}, ${PLASTIC_CAT.name_sw}, ${PLASTIC_CAT.name_hi}, ${PLASTIC_CAT.sort_order})
    on conflict (slug) do update set name_en = excluded.name_en
    returning id
  `;
  console.log(`✓ category "${PLASTIC_CAT.slug}"`);

  for (const p of PRODUCTS) {
    const existing = await sql`select id from products where sku = ${p.sku}`;
    let productId;
    if (existing.length > 0) {
      productId = existing[0].id;
      console.log(`= ${p.sku} ${p.name_en} (already exists)`);
    } else {
      const [{ id }] = await sql`
        insert into products (
          sku, slug, category_id,
          name_en, name_sw, name_hi,
          description_en, description_sw, description_hi,
          price_tsh, stock, is_active, is_featured
        ) values (
          ${p.sku}, ${p.slug}, ${catId},
          ${p.name_en}, ${p.name_sw}, ${p.name_hi},
          ${p.description_en}, ${p.description_sw}, ${p.description_hi},
          ${p.price_tsh}, ${p.stock}, true, ${p.is_featured}
        )
        returning id
      `;
      productId = id;
      console.log(`+ ${p.sku} ${p.name_en}`);
    }

    // Replace any prior placeholder images for this product, then add the new set.
    await sql`
      delete from product_images
      where product_id = ${productId} and (
        storage_path like 'https://dummyimage.com/%' or
        storage_path like 'https://picsum.photos/%' or
        storage_path like 'https://images.unsplash.com/%'
      )
    `;
    for (let i = 0; i < p.images.length; i++) {
      const photoUrl = url800(p.images[i], CROPS[i % CROPS.length]);
      await sql`
        insert into product_images (product_id, storage_path, alt, sort_order)
        values (${productId}, ${photoUrl}, ${p.name_en + " — placeholder"}, ${i})
      `;
    }
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
