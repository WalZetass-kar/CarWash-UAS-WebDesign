DELETE FROM payments
WHERE status = 'belum_bayar';

DELETE FROM payments a
USING payments b
WHERE a.transaction_id = b.transaction_id
  AND a.id <> b.id
  AND a.created_at < b.created_at;

DROP INDEX IF EXISTS payments_transaction_idx;
CREATE UNIQUE INDEX IF NOT EXISTS payments_transaction_unique ON payments(transaction_id);

CREATE TABLE IF NOT EXISTS app_settings (
  id varchar(40) PRIMARY KEY,
  business_name varchar(160) NOT NULL,
  business_phone varchar(40) NOT NULL DEFAULT '',
  business_address text NOT NULL DEFAULT '',
  queue_slot_capacity integer NOT NULL DEFAULT 4,
  report_default_range_days integer NOT NULL DEFAULT 30,
  auto_print_invoice boolean NOT NULL DEFAULT false,
  invoice_footer text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_settings (
  id,
  business_name,
  business_phone,
  business_address,
  queue_slot_capacity,
  report_default_range_days,
  auto_print_invoice,
  invoice_footer
)
VALUES (
  'default',
  'Kilap Kendaraan Car Wash',
  '0812-3456-7890',
  'Jl. Cuci Kilat No. 88, Jakarta',
  4,
  30,
  false,
  'Terima kasih telah mempercayakan kendaraan Anda kepada Kilap Kendaraan.'
)
ON CONFLICT (id) DO NOTHING;
