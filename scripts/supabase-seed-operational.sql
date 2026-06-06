-- Kilap Kendaraan seed operasional Supabase
-- Jalankan SETELAH scripts/supabase-bootstrap.sql
-- Direkomendasikan untuk database baru / kosong.
--
-- Akun awal:
--   admin@kilapkendaraan.my.id   / admin123
--   kasir@kilapkendaraan.my.id   / kasir123
--   staff@kilapkendaraan.my.id   / staff123
--   petugas@kilapkendaraan.my.id / petugas123

insert into users (
  id,
  name,
  email,
  password_hash,
  role,
  is_active,
  created_at,
  updated_at,
  deleted_at
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Admin Kilap Kendaraan',
    'admin@kilapkendaraan.my.id',
    '$2b$12$bEt2IVD1ASYMEb5Lu7CPAu0Rrpf4KSmR1B3a0t5/OITLbVaxMreDW',
    'admin',
    true,
    now(),
    now(),
    null
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'Kasir Kilap Kendaraan',
    'kasir@kilapkendaraan.my.id',
    '$2b$12$37j7WkOyGCNlpH/b0mXoFevfY96jIW542RLKa1oHzV386972n8gYW',
    'kasir',
    true,
    now(),
    now(),
    null
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'Staff Kilap Kendaraan',
    'staff@kilapkendaraan.my.id',
    '$2b$12$UJwRsH1Jo7VrQ0j2Y93ZsOxKxKQCOCjVDltWXLOy0/IOrqdnBcfeq',
    'staff',
    true,
    now(),
    now(),
    null
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Petugas Kilap Kendaraan',
    'petugas@kilapkendaraan.my.id',
    '$2b$12$aclal4r5dlJlauG1kGP8H.zKgLvQBt8j30I3t8OJtGwXsvxiwefwO',
    'petugas',
    true,
    now(),
    now(),
    null
  )
on conflict (email) do update
set
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = now(),
  deleted_at = null;

insert into app_settings (
  id,
  business_name,
  business_phone,
  business_address,
  queue_slot_capacity,
  report_default_range_days,
  auto_print_invoice,
  invoice_footer,
  created_at,
  updated_at
)
values (
  'default',
  'Kilap Kendaraan Car Wash',
  '0812-3456-7890',
  'Jl. Cuci Kilat No. 88, Jakarta',
  4,
  30,
  false,
  'Terima kasih telah mempercayakan kendaraan Anda kepada Kilap Kendaraan.',
  now(),
  now()
)
on conflict (id) do update
set
  business_name = excluded.business_name,
  business_phone = excluded.business_phone,
  business_address = excluded.business_address,
  queue_slot_capacity = excluded.queue_slot_capacity,
  report_default_range_days = excluded.report_default_range_days,
  auto_print_invoice = excluded.auto_print_invoice,
  invoice_footer = excluded.invoice_footer,
  updated_at = now();

insert into wash_packages (
  id,
  name,
  description,
  price,
  estimated_minutes,
  image_url,
  is_active,
  created_at,
  updated_at,
  deleted_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'Express Wash',
    'Cuci eksterior cepat, bilas salju, dan pengeringan microfiber.',
    35000,
    25,
    null,
    true,
    now() - interval '20 days',
    now(),
    null
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Premium Gloss',
    'Cuci eksterior, vacuum interior, semir ban, dan wax kilap.',
    85000,
    55,
    null,
    true,
    now() - interval '20 days',
    now(),
    null
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'Detailing Care',
    'Perawatan lengkap interior-eksterior dengan coating ringan.',
    175000,
    120,
    null,
    true,
    now() - interval '18 days',
    now(),
    null
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'Motor Shine',
    'Cuci motor, degreaser ringan, dan finishing body.',
    25000,
    20,
    null,
    true,
    now() - interval '16 days',
    now(),
    null
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  estimated_minutes = excluded.estimated_minutes,
  image_url = excluded.image_url,
  is_active = excluded.is_active,
  updated_at = now(),
  deleted_at = null;

insert into customers (
  id,
  name,
  phone,
  license_plate,
  vehicle_type,
  notes,
  created_at,
  updated_at,
  deleted_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'Rizky Pratama',
    '081234567890',
    'B 1288 KLR',
    'mobil',
    'Interior perlu vacuum ekstra',
    now() - interval '8 days',
    now(),
    null
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Nadia Putri',
    '082112223333',
    'D 4040 NAD',
    'suv',
    'Pelanggan langganan paket premium',
    now() - interval '5 days',
    now(),
    null
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Fajar Maulana',
    '085677788899',
    'F 9012 FM',
    'motor',
    'Tanpa semir ban',
    now() - interval '2 days',
    now(),
    null
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'Sinta Aulia',
    '087700001111',
    'AB 77 SA',
    'van',
    'Booking korporat',
    now() - interval '1 day',
    now(),
    null
  )
on conflict (id) do update
set
  name = excluded.name,
  phone = excluded.phone,
  license_plate = excluded.license_plate,
  vehicle_type = excluded.vehicle_type,
  notes = excluded.notes,
  updated_at = now(),
  deleted_at = null;

insert into queues (
  id,
  queue_number,
  customer_id,
  package_id,
  scheduled_at,
  status,
  notes,
  created_at,
  updated_at,
  deleted_at
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    'CR-001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    date_trunc('day', now()) + interval '9 hours 30 minutes',
    'selesai',
    null,
    date_trunc('day', now()) + interval '9 hours',
    now(),
    null
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'CR-002',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003',
    date_trunc('day', now()) + interval '10 hours 15 minutes',
    'diproses',
    null,
    date_trunc('day', now()) + interval '9 hours 25 minutes',
    now(),
    null
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    'CR-003',
    '10000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000004',
    date_trunc('day', now()) + interval '11 hours',
    'menunggu',
    null,
    date_trunc('day', now()) + interval '10 hours 10 minutes',
    now(),
    null
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    'CR-004',
    '10000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000001',
    date_trunc('day', now() + interval '1 day') + interval '8 hours 30 minutes',
    'menunggu',
    null,
    date_trunc('day', now()) + interval '11 hours 15 minutes',
    now(),
    null
  )
on conflict (id) do update
set
  queue_number = excluded.queue_number,
  customer_id = excluded.customer_id,
  package_id = excluded.package_id,
  scheduled_at = excluded.scheduled_at,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now(),
  deleted_at = null;

insert into transactions (
  id,
  queue_id,
  customer_id,
  package_id,
  subtotal,
  discount,
  total,
  status,
  created_by,
  created_at,
  updated_at,
  deleted_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    85000,
    0,
    85000,
    'lunas',
    '00000000-0000-4000-8000-000000000003',
    date_trunc('day', now()) + interval '10 hours 15 minutes',
    now(),
    null
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003',
    175000,
    0,
    175000,
    'belum_bayar',
    '00000000-0000-4000-8000-000000000003',
    date_trunc('day', now()) + interval '10 hours 25 minutes',
    now(),
    null
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000004',
    25000,
    0,
    25000,
    'belum_bayar',
    '00000000-0000-4000-8000-000000000003',
    date_trunc('day', now()) + interval '10 hours 40 minutes',
    now(),
    null
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000001',
    35000,
    0,
    35000,
    'belum_bayar',
    '00000000-0000-4000-8000-000000000003',
    date_trunc('day', now()) + interval '11 hours 20 minutes',
    now(),
    null
  )
on conflict (id) do update
set
  queue_id = excluded.queue_id,
  customer_id = excluded.customer_id,
  package_id = excluded.package_id,
  subtotal = excluded.subtotal,
  discount = excluded.discount,
  total = excluded.total,
  status = excluded.status,
  created_by = excluded.created_by,
  updated_at = now(),
  deleted_at = null;

insert into payments (
  id,
  transaction_id,
  method,
  amount,
  status,
  paid_at,
  created_at,
  updated_at,
  deleted_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'qris',
    85000,
    'lunas',
    date_trunc('day', now()) + interval '10 hours 20 minutes',
    date_trunc('day', now()) + interval '10 hours 20 minutes',
    now(),
    null
  )
on conflict (id) do update
set
  transaction_id = excluded.transaction_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  paid_at = excluded.paid_at,
  updated_at = now(),
  deleted_at = null;

insert into activity_logs (
  id,
  user_id,
  action,
  entity,
  entity_id,
  ip_address,
  user_agent,
  created_at,
  updated_at,
  deleted_at
)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'seed',
    'database',
    null,
    '127.0.0.1',
    'supabase-sql-editor',
    now(),
    now(),
    null
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
    'create',
    'queues',
    '30000000-0000-4000-8000-000000000002',
    '127.0.0.1',
    'supabase-sql-editor',
    now(),
    now(),
    null
  )
on conflict (id) do update
set
  user_id = excluded.user_id,
  action = excluded.action,
  entity = excluded.entity,
  entity_id = excluded.entity_id,
  ip_address = excluded.ip_address,
  user_agent = excluded.user_agent,
  updated_at = now(),
  deleted_at = null;
ull;
ted_at = null;
ull;
