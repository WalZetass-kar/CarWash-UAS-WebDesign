-- Kilap Kendaraan Supabase bootstrap
-- Jalankan file ini di Supabase SQL Editor untuk membuat schema utama
-- dan akun admin awal aplikasi.
--
-- Login admin default:
--   email    : admin@kilapkendaraan.my.id
--   password : admin123
--
-- Catatan:
-- - Aplikasi ini memakai tabel "users" internal, bukan Supabase Auth.
-- - Setelah login pertama, ganti password admin dari dashboard atau reset via SQL.

create extension if not exists "pgcrypto";

do $$ begin
  create type role as enum ('admin', 'kasir', 'staff', 'petugas');
exception
  when duplicate_object then null;
end $$;

alter type role add value if not exists 'admin';
alter type role add value if not exists 'kasir';
alter type role add value if not exists 'staff';
alter type role add value if not exists 'petugas';

do $$ begin
  create type vehicle_type as enum ('mobil', 'motor', 'suv', 'pickup', 'van');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type queue_status as enum (
    'menunggu',
    'antrian',
    'sedang_dicuci',
    'interior_cleaning',
    'finishing',
    'selesai',
    'dibatalkan',
    'diproses'
  );
exception
  when duplicate_object then null;
end $$;

alter type queue_status add value if not exists 'menunggu';
alter type queue_status add value if not exists 'antrian';
alter type queue_status add value if not exists 'sedang_dicuci';
alter type queue_status add value if not exists 'interior_cleaning';
alter type queue_status add value if not exists 'finishing';
alter type queue_status add value if not exists 'selesai';
alter type queue_status add value if not exists 'dibatalkan';
alter type queue_status add value if not exists 'diproses';

do $$ begin
  create type payment_method as enum ('tunai', 'transfer', 'qris', 'e-wallet');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum ('belum_bayar', 'lunas');
exception
  when duplicate_object then null;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  email varchar(180) not null,
  password_hash text not null,
  role role not null default 'petugas',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  phone varchar(24) not null,
  license_plate varchar(20) not null,
  vehicle_type vehicle_type not null default 'mobil',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists wash_packages (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  description text not null,
  price integer not null,
  estimated_minutes integer not null,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table wash_packages add column if not exists image_url text;

create table if not exists queues (
  id uuid primary key default gen_random_uuid(),
  queue_number varchar(24) not null,
  customer_id uuid not null references customers(id),
  package_id uuid not null references wash_packages(id),
  scheduled_at timestamptz not null,
  status queue_status not null default 'menunggu',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references queues(id),
  customer_id uuid not null references customers(id),
  package_id uuid not null references wash_packages(id),
  subtotal integer not null,
  discount integer not null default 0,
  total integer not null,
  status payment_status not null default 'belum_bayar',
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id),
  method payment_method not null,
  amount integer not null,
  status payment_status not null default 'belum_bayar',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists app_settings (
  id varchar(40) primary key,
  business_name varchar(160) not null,
  business_phone varchar(40) not null default '',
  business_address text not null default '',
  queue_slot_capacity integer not null default 4,
  report_default_range_days integer not null default 30,
  auto_print_invoice boolean not null default false,
  invoice_footer text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action varchar(80) not null,
  entity varchar(80) not null,
  entity_id uuid,
  ip_address varchar(80),
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists users_email_unique on users(email);
create index if not exists users_role_idx on users(role);
create index if not exists customers_name_idx on customers(name);
create index if not exists customers_plate_idx on customers(license_plate);
create index if not exists wash_packages_active_idx on wash_packages(is_active);
create unique index if not exists queues_queue_number_unique on queues(queue_number);
create index if not exists queues_status_idx on queues(status);
create index if not exists queues_scheduled_at_idx on queues(scheduled_at);
create index if not exists transactions_created_at_idx on transactions(created_at);
create index if not exists transactions_status_idx on transactions(status);
drop index if exists payments_transaction_idx;
create unique index if not exists payments_transaction_unique on payments(transaction_id);
create index if not exists payments_method_idx on payments(method);
create index if not exists activity_logs_user_idx on activity_logs(user_id);
create index if not exists activity_logs_entity_idx on activity_logs(entity, entity_id);
create index if not exists activity_logs_created_at_idx on activity_logs(created_at);

insert into users (
  id,
  name,
  email,
  password_hash,
  role,
  is_active,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000001',
  'Admin Kilap Kendaraan',
  'admin@kilapkendaraan.my.id',
  '$2b$12$06iTjqN6KQ6vIpSB8qZ/PuwFMkPlN7r6LOiZhfCOUEwBDhfNoVyLW',
  'admin',
  true,
  now(),
  now()
)
on conflict (email) do nothing;
