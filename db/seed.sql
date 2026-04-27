-- FrankyShop seed — only inserts if categories table is empty.

do $$
begin
  if (select count(*) from categories) > 0 then return; end if;

  insert into categories (slug, name_en, name_sw, name_hi, sort_order) values
    ('thermos', 'Thermos & Flasks', 'Termos na chupa', 'थर्मस और फ्लास्क', 1),
    ('cutlery', 'Cutlery',          'Vijiko na visu', 'कटलरी',              2),
    ('dishes',  'Dishes & Plates',  'Sahani',         'थाली और प्लेट',       3);

  insert into delivery_zones (name_en, name_sw, name_hi, fee_tsh, sort_order) values
    ('Dar es Salaam — city',      'Dar es Salaam — mjini',      'दार एस सलाम — शहर',    3000, 1),
    ('Dar es Salaam — outskirts', 'Dar es Salaam — pembezoni',  'दार एस सलाम — बाहरी',  6000, 2),
    ('Upcountry (courier)',       'Mikoa (courier)',            'अपकंट्री (courier)',   15000, 3);

  insert into products (sku, slug, category_id, name_en, name_sw, name_hi, description_en, price_tsh, stock, is_featured) values
    ('FK-TH-001', 'classic-vacuum-thermos-1l',   (select id from categories where slug='thermos'), 'Classic Vacuum Thermos 1L',   'Termos ya kawaida 1L',          'क्लासिक वैक्यूम थर्मस 1L',     '24-hour heat retention, stainless steel.',          28000, 40,  true),
    ('FK-TH-002', 'travel-flask-500ml',          (select id from categories where slug='thermos'), 'Travel Flask 500ml',           'Chupa ya safari 500ml',         'ट्रैवल फ्लास्क 500ml',          'Compact, leakproof, 12-hour heat retention.',       15000, 60,  true),
    ('FK-TH-003', 'family-thermos-2l',           (select id from categories where slug='thermos'), 'Family Thermos 2L',            'Termos ya familia 2L',          'फैमिली थर्मस 2L',               'Big-capacity vacuum thermos for the whole family.', 42000, 25,  false),
    ('FK-CT-001', 'stainless-teaspoon-set-12',   (select id from categories where slug='cutlery'), 'Stainless Teaspoon Set (12)',  'Seti ya vijiko 12',             'स्टेनलेस चम्मच सेट (12)',      '12-piece stainless steel teaspoon set.',             8000, 120, true),
    ('FK-CT-002', 'dinner-spoon-set-6',          (select id from categories where slug='cutlery'), 'Dinner Spoon Set (6)',         'Seti ya vijiko vya chakula 6',  'डिनर स्पून सेट (6)',           'Heavy-grade dinner spoons, 6-piece set.',            9500, 90,  false),
    ('FK-CT-003', 'fork-set-12',                 (select id from categories where slug='cutlery'), 'Fork Set (12)',                'Seti ya uma 12',                'फोर्क सेट (12)',                 '12-piece fork set, mirror finish.',                  7500, 100, false),
    ('FK-DS-001', 'talrikar-steel-plate-set-6',  (select id from categories where slug='dishes'),  'Talrikar Steel Plate Set (6)', 'Sahani za chuma 6',             'तलरीकर स्टील प्लेट सेट (6)',  'Traditional steel plates, family pack of 6.',       22000, 35,  true),
    ('FK-DS-002', 'thali-set-medium',            (select id from categories where slug='dishes'),  'Thali Set (medium)',           'Seti ya thali (kati)',          'थाली सेट (मध्यम)',              'Stainless steel compartment thali.',                18000, 50,  false),
    ('FK-DS-003', 'serving-bowl-set-3',          (select id from categories where slug='dishes'),  'Serving Bowl Set (3)',         'Seti ya bakuli 3',              'सर्विंग बाउल सेट (3)',          '3 nesting serving bowls, stainless steel.',         14000, 60,  false),
    ('FK-DS-004', 'kitchen-essentials-bundle',   (select id from categories where slug='dishes'),  'Kitchen Essentials Bundle',    'Vifurushi vya jikoni',          'किचन एसेंशियल्स बंडल',         'Bundle: 6 plates + 6 spoons + 6 forks. Save 15%.',  35000, 20,  true);

  update products
  set wholesale_tiers = '[{"min_qty":3,"price_tsh":33000},{"min_qty":10,"price_tsh":31000}]'::jsonb
  where sku = 'FK-DS-004';
end $$;
