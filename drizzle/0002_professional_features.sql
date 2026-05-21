ALTER TYPE role ADD VALUE IF NOT EXISTS 'kasir';
ALTER TYPE role ADD VALUE IF NOT EXISTS 'staff';

ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'antrian';
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'sedang_dicuci';
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'interior_cleaning';
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'finishing';

ALTER TABLE wash_packages
ADD COLUMN IF NOT EXISTS image_url text;
