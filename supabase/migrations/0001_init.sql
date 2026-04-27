-- FrankyShop initial schema
-- Phase 0 / L-145

create extension if not exists "pgcrypto";

-- ===== ENUMS =====
create type order_status as enum ('pending','paid','failed','refunded','shipped','delivered','cancelled');
create type promotion_type as enum ('percent_off','fixed_off','bogo');
create type staff_role as enum ('admin','staff');
create type job_app_status as enum ('new','reviewing','contacted','archived');

-- ===== CATEGORIES =====
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_sw text,
  name_hi text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ===== PRODUCTS =====
create table products (
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
  -- wholesale tiers: jsonb [{min_qty:int, price_tsh:int}, ...]
  wholesale_tiers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on products (category_id);
create index on products (is_active, is_featured);
create index on products using gin (to_tsvector('simple', name_en || ' ' || coalesce(name_sw,'') || ' ' || coalesce(name_hi,'') || ' ' || sku));

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index on product_images (product_id, sort_order);

-- ===== CUSTOMERS =====
create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text,
  phone text,
  email text,
  preferred_locale text default 'en',
  loyalty_points int not null default 0,
  created_at timestamptz not null default now()
);

-- ===== DELIVERY ZONES =====
create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_sw text,
  name_hi text,
  fee_tsh int not null default 0 check (fee_tsh >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- ===== ORDERS =====
create table orders (
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
create index on orders (status, created_at desc);
create index on orders (customer_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  sku text not null,
  name text not null,
  unit_price_tsh int not null,
  quantity int not null check (quantity > 0),
  line_total_tsh int not null
);
create index on order_items (order_id);

-- ===== PROMOTIONS =====
create table promotions (
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
create index on promotions (is_active, starts_at, ends_at);

-- ===== REVIEWS =====
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  body text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index on reviews (product_id, is_approved);

-- ===== JOB APPLICATIONS =====
create table job_applications (
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
create index on job_applications (status, created_at desc);

-- ===== STAFF =====
create table staff_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  email text not null,
  full_name text,
  role staff_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ===== AUDIT LOG =====
create table audit_log (
  id bigserial primary key,
  actor_auth_user_id uuid,
  actor_role staff_role,
  action text not null,
  entity_type text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index on audit_log (entity_type, entity_id);
create index on audit_log (created_at desc);

-- ===== ROW-LEVEL SECURITY =====
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table customers enable row level security;
alter table delivery_zones enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table promotions enable row level security;
alter table reviews enable row level security;
alter table job_applications enable row level security;
alter table staff_users enable row level security;
alter table audit_log enable row level security;

-- Helper: is current auth user staff?
create or replace function is_staff() returns boolean language sql stable as $$
  select exists (
    select 1 from staff_users
    where auth_user_id = auth.uid() and is_active = true
  );
$$;

create or replace function is_admin() returns boolean language sql stable as $$
  select exists (
    select 1 from staff_users
    where auth_user_id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- PUBLIC READ: catalog browsing
create policy categories_public_read on categories for select using (true);
create policy products_public_read on products for select using (is_active = true);
create policy product_images_public_read on product_images for select using (true);
create policy delivery_zones_public_read on delivery_zones for select using (is_active = true);
create policy promotions_public_read on promotions for select using (is_active = true);
create policy reviews_public_read on reviews for select using (is_approved = true);

-- CUSTOMER read-own
create policy customers_self_read on customers for select using (auth_user_id = auth.uid());
create policy customers_self_update on customers for update using (auth_user_id = auth.uid());
create policy orders_self_read on orders for select using (
  customer_id in (select id from customers where auth_user_id = auth.uid())
);
create policy order_items_self_read on order_items for select using (
  order_id in (select id from orders where customer_id in (select id from customers where auth_user_id = auth.uid()))
);

-- ANON insert: job applications (public form)
create policy job_apps_anon_insert on job_applications for insert with check (true);

-- STAFF full access
create policy products_staff_all on products for all using (is_staff()) with check (is_staff());
create policy categories_staff_all on categories for all using (is_staff()) with check (is_staff());
create policy product_images_staff_all on product_images for all using (is_staff()) with check (is_staff());
create policy orders_staff_all on orders for all using (is_staff()) with check (is_staff());
create policy order_items_staff_all on order_items for all using (is_staff()) with check (is_staff());
create policy promotions_staff_all on promotions for all using (is_staff()) with check (is_staff());
create policy delivery_zones_staff_all on delivery_zones for all using (is_staff()) with check (is_staff());
create policy reviews_staff_all on reviews for all using (is_staff()) with check (is_staff());
create policy job_apps_staff_all on job_applications for all using (is_staff()) with check (is_staff());

-- ADMIN-only: staff_users + audit_log
create policy staff_admin_all on staff_users for all using (is_admin()) with check (is_admin());
create policy audit_log_admin_read on audit_log for select using (is_admin());
create policy audit_log_staff_insert on audit_log for insert with check (is_staff());
