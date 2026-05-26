-- Reset akun admin internal CleanRide
-- Default login setelah reset:
--   admin@cleanride.my.id / admin123

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
values (
  '00000000-0000-4000-8000-000000000001',
  'Admin CleanRide',
  'admin@cleanride.my.id',
  '$2b$12$06iTjqN6KQ6vIpSB8qZ/PuwFMkPlN7r6LOiZhfCOUEwBDhfNoVyLW',
  'admin',
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
  is_active = true,
  updated_at = now(),
  deleted_at = null;
