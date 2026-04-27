-- Editable site-wide settings (contact info, hours, map pin, hero copy).
create table if not exists site_content (
  key text primary key,
  value_en text,
  value_sw text,
  value_hi text,
  updated_at timestamptz not null default now(),
  updated_by uuid references staff_users(id) on delete set null
);

-- Seed defaults (idempotent — only on empty)
insert into site_content (key, value_en) values
  ('whatsapp_number', '255000000000'),
  ('shop_phone',      '+255 000 000 000'),
  ('shop_lat',        '-6.8161'),
  ('shop_lng',        '39.2706')
on conflict (key) do nothing;

insert into site_content (key, value_en, value_sw, value_hi) values
  ('shop_address',
    'Kariakoo, Dar es Salaam, Tanzania',
    'Kariakoo, Dar es Salaam, Tanzania',
    'करियाकू, दार एस सलाम, तंज़ानिया'),
  ('shop_hours',
    'Mon–Sat · 8:30 — 18:00',
    'Jumatatu–Jumamosi · 8:30 — 18:00',
    'सोम–शनि · 8:30 — 18:00')
on conflict (key) do nothing;
