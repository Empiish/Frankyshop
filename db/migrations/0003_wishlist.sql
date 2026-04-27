-- Wishlist (per-customer saved items) — Phase 4 / L-149

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);
create index if not exists wishlist_customer_idx on wishlist_items (customer_id, created_at desc);
