-- SQL untuk membuat tabel galeri di Supabase
-- Lokasi file: scripts/gallery-table.sql

create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title varchar(200),
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists gallery_active_idx on gallery(is_active);
create index if not exists gallery_sort_order_idx on gallery(sort_order);
