CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE role AS ENUM ('admin', 'petugas');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('mobil', 'motor', 'suv', 'pickup', 'van');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE queue_status AS ENUM ('menunggu', 'diproses', 'selesai', 'dibatalkan');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('tunai', 'transfer', 'qris', 'e-wallet');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('belum_bayar', 'lunas');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  email varchar(180) NOT NULL,
  password_hash text NOT NULL,
  role role NOT NULL DEFAULT 'petugas',
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  phone varchar(24) NOT NULL,
  license_plate varchar(20) NOT NULL,
  vehicle_type vehicle_type NOT NULL DEFAULT 'mobil',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS wash_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  estimated_minutes integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_number varchar(24) NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id),
  package_id uuid NOT NULL REFERENCES wash_packages(id),
  scheduled_at timestamptz NOT NULL,
  status queue_status NOT NULL DEFAULT 'menunggu',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  package_id uuid NOT NULL REFERENCES wash_packages(id),
  subtotal integer NOT NULL,
  discount integer NOT NULL DEFAULT 0,
  total integer NOT NULL,
  status payment_status NOT NULL DEFAULT 'belum_bayar',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id),
  method payment_method NOT NULL,
  amount integer NOT NULL,
  status payment_status NOT NULL DEFAULT 'belum_bayar',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action varchar(80) NOT NULL,
  entity varchar(80) NOT NULL,
  entity_id uuid,
  ip_address varchar(80),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers(name);
CREATE INDEX IF NOT EXISTS customers_plate_idx ON customers(license_plate);
CREATE INDEX IF NOT EXISTS wash_packages_active_idx ON wash_packages(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS queues_queue_number_unique ON queues(queue_number);
CREATE INDEX IF NOT EXISTS queues_status_idx ON queues(status);
CREATE INDEX IF NOT EXISTS queues_scheduled_at_idx ON queues(scheduled_at);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
CREATE INDEX IF NOT EXISTS payments_transaction_idx ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS payments_method_idx ON payments(method);
CREATE INDEX IF NOT EXISTS activity_logs_user_idx ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_entity_idx ON activity_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at);
