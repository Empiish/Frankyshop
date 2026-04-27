-- FrankyShop initial schema (DataNexus / postgres.js)
-- Auth is enforced at the app layer (Next.js middleware + JWT), not via RLS.
-- Run with: npm run db:migrate

create extension if not exists "pgcrypto";

-- ===== ENUMS =====
do $$ begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('pending','paid','failed','refunded','shipped','delivered','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'promotion_type') then
    create type promotion_type as enum ('percent_off','fixed_off','bogo');
  end if;
  if not exists (select 1 from pg_type where typname = 'staff_role') then
    create type staff_role as enum ('admin','staff');
  end if;
  if not exists (select 1 from pg_type where typname = 'job_app_status') then
    create type job_app_status as enum ('new','reviewing','contacted','archived');
  end if;
end $$;

-- ===== CATEGORIES =====
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_sw text,
  name_hi text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ===== PRODUCTS =====
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  category_id uuid references categories(id) on delete set null,
  name_en text not null,
  name_sw text,
  name_hi text,
  description_en text,
  description_sw text,
  description_hi text,
  selling_techniques_en text,
  selling_techniques_sw text,
  selling_techniques_hi text,
  price_tsh int not null check (price_tsh >= 0),
  stock int not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  wholesale_tiers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on products (category_id);
create index if not exists products_active_featured_idx on products (is_active, is_featured);
create index if not exists products_search_idx on products
  using gin (to_tsvector('simple', name_en || ' ' || coalesce(name_sw,'') || ' ' || coalesce(name_hi,'') || ' ' || sku));

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on product_images (product_id, sort_order);

-- ===== CUSTOMERS =====
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  phone text,
  email text unique,
  password_hash text,
  preferred_locale text default 'en',
  loyalty_points int not null default 0,
  created_at timestamptz not null default now()
);

-- ===== DELIVERY ZONES =====
create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_sw text,
  name_hi text,
  fee_tsh int not null default 0 check (fee_tsh >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- ===== ORDERS =====
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_zone_id uuid references delivery_zones(id) on delete set null,
  delivery_address text,
  subtotal_tsh int not null,
  delivery_fee_tsh int not null default 0,
  discount_tsh int not null default 0,
  total_tsh int not null,
  status order_status not null default 'pending',
  payment_method text,
  payment_ref text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on orders (status, created_at desc);
create index if not exists orders_customer_idx on orders (customer_id);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  sku text not null,
  name text not null,
  unit_price_tsh int not null,
  quantity int not null check (quantity > 0),
  line_total_tsh int not null
);
create index if not exists order_items_order_idx on order_items (order_id);

-- ===== PROMOTIONS =====
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name_en text not null,
  name_sw text,
  name_hi text,
  type promotion_type not null,
  value int not null,
  starts_at timestamptz,
  ends_at timestamptz,
  applies_to_category_id uuid references categories(id) on delete set null,
  applies_to_product_id uuid references products(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists promotions_active_idx on promotions (is_active, starts_at, ends_at);

-- ===== REVIEWS =====
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  body text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on reviews (product_id, is_approved);

-- ===== JOB APPLICATIONS =====
create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  position text,
  message text,
  status job_app_status not null default 'new',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists job_apps_status_idx on job_applications (status, created_at desc);

-- ===== STAFF (admin + staff) =====
create table if not exists staff_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  role staff_role not null default 'staff',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===== AUDIT LOG =====
create table if not exists audit_log (
  id bigserial primary key,
  actor_staff_id uuid references staff_users(id) on delete set null,
  actor_role staff_role,
  action text not null,
  entity_type text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_entity_idx on audit_log (entity_type, entity_id);
create index if not exists audit_log_created_idx on audit_log (created_at desc);
