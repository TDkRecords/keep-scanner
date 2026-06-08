-- Ejecuta este script en el SQL Editor de Supabase

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  barcode text unique,
  name text not null,
  quantity integer not null default 0 check (quantity >= 0),
  price numeric(12, 2) not null check (price >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  total numeric(12, 2) not null,
  items_count integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales (id) on delete cascade not null,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  barcode text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null,
  subtotal numeric(12, 2) not null
);

create index if not exists idx_products_barcode on products (barcode);
create index if not exists idx_products_name on products (name);
create index if not exists idx_sale_items_sale_id on sale_items (sale_id);

alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;

create policy "products_all" on products for all using (true) with check (true);
create policy "sales_all" on sales for all using (true) with check (true);
create policy "sale_items_all" on sale_items for all using (true) with check (true);
