# CleanRide Car Wash

Aplikasi web fullstack modern untuk Projek UAS Mata Kuliah Web Design. CleanRide berisi landing page promosi, dashboard admin/petugas, CRUD operasional car wash, realtime queue, laporan, invoice, dan autentikasi JWT berbasis HTTPOnly cookies.

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript
- TailwindCSS 4, shadcn/ui style components, Lucide React Icons
- Framer Motion, Flatpickr, TanStack Table, Chart.js
- Supabase Database + Supabase Realtime
- Drizzle ORM + Drizzle Kit
- Zod, JWT `jose`, bcryptjs
- HTTPOnly cookies, RBAC middleware, CSRF guard, security headers
- PWA manifest + service worker basic cache
- Vercel deployment ready

## Cara Install

```bash
npm install
cp .env.example .env.local
npm run env:check
npm run dev
```

Buka `http://localhost:3000`.

Jika filesystem lokal terasa lambat saat `next dev` default, jalankan fallback webpack:

```bash
npm run dev:webpack
```

Untuk preview production lokal dengan konfigurasi yang sama seperti deploy, gunakan:

```bash
npm run env:check
npm run build
npm run start
```

Untuk smoke test production lokal setelah build:

```bash
npm run smoke:e2e
```

## Setup Supabase

1. Buat project Supabase.
2. Ambil `NEXT_PUBLIC_SUPABASE_URL`, key browser Supabase (`NEXT_PUBLIC_SUPABASE_ANON_KEY` atau `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), dan key admin (`SUPABASE_SERVICE_ROLE_KEY` atau `SUPABASE_SECRET_KEY`).
3. Ambil connection string Postgres dari Project Settings > Database.
4. Isi `.env.local`. Aplikasi akan membaca `DATABASE_URL` atau fallback langsung ke `POSTGRES_URL_NON_POOLING` / `POSTGRES_URL` kalau itu yang diberikan provider.
5. Jalankan schema:

```bash
npm run db:push
npm run db:seed
```

Alternatif manual di Supabase SQL Editor:

1. Jalankan `scripts/supabase-bootstrap.sql`
2. Jika ingin langsung ada data operasional contoh, jalankan `scripts/supabase-seed-operational.sql`
3. Login dengan akun awal:
   `admin@cleanride.my.id` / `admin123`
   `kasir@cleanride.my.id` / `kasir123`
   `staff@cleanride.my.id` / `staff123`
   `petugas@cleanride.my.id` / `petugas123`
4. Jika perlu reset ulang akun admin, jalankan `scripts/supabase-reset-admin.sql`

Kalau ingin pakai password lain, generate hash bcrypt dengan:

```bash
npm run password:hash -- "password-baru"
```

Lalu ganti nilai `password_hash` pada SQL admin.

Untuk upload gallery production, buat bucket Supabase Storage public bernama `cleanride`. API upload akan menyimpan file ke path `gallery/...` bila `SUPABASE_SERVICE_ROLE_KEY` tersedia.

## Drizzle ORM

Schema utama ada di `drizzle/schema.ts`.

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## Akun Seed Awal

- Admin: `admin@cleanride.my.id` / `admin123`
- Kasir: `kasir@cleanride.my.id` / `kasir123`
- Staff: `staff@cleanride.my.id` / `staff123`
- Petugas: `petugas@cleanride.my.id` / `petugas123`

Data akun di atas berasal dari proses seed database. Aplikasi tidak lagi fallback ke data in-memory pada mode normal.

## Struktur Database

Semua tabel memiliki `id`, `created_at`, `updated_at`, dan `deleted_at` untuk soft delete.

- `users`: user dashboard, role admin/petugas, password hash, status aktif
- `customers`: data pelanggan dan kendaraan
- `wash_packages`: paket pencucian, harga, estimasi, status aktif
- `queues`: antrian pencucian, jadwal Flatpickr, status realtime
- `transactions`: transaksi dari antrian
- `payments`: metode dan status pembayaran
- `activity_logs`: login, logout, CRUD, pembayaran, update status, reset password

## Struktur Folder

- `app`: App Router pages, API routes, metadata, sitemap, robots
- `components`: reusable UI, dashboard shell, providers, realtime
- `features`: modul auth, customer, package, queue, payment, report
- `hooks`: client hooks seperti CSRF fetch
- `lib`: auth, security, constants, utils, Supabase clients
- `services`: data access layer Drizzle + orchestration logic
- `schemas`: validasi Zod
- `drizzle`: schema, config, migration SQL, seeder
- `actions`, `api`, `middleware`: folder pendukung sesuai requirement
- `proxy.ts`: pengganti modern `middleware.ts` di Next.js 16 untuk auth, RBAC, CSRF cookie, dan security headers

## Fitur

- Landing page responsive dengan hero, CTA, paket, statistik, testimoni, FAQ, gallery, footer
- Login/logout JWT, HTTPOnly cookies, SameSite, route protection via Next.js Proxy atau middleware modern
- Session otomatis tidak valid setelah pergantian tanggal pukul 00:00 Asia/Jakarta
- RBAC admin/petugas di middleware dan API routes
- Dashboard analytics, search global, notifikasi operasional nyata, dark/light mode
- CRUD pelanggan, paket, antrian, pembayaran, user
- Edit pelanggan, edit paket, edit/reset password user, dan nonaktifkan user
- Pembayaran memilih transaksi pending dari data antrian/transaksi, bukan input ID manual
- Supabase Realtime untuk queues dan payments
- Dashboard auto-refresh saat event realtime queues/payments masuk
- Dashboard analytics mingguan/bulanan dan aktivitas terbaru dihitung dari data nyata, bukan dummy statis
- TanStack Table untuk search, sorting, pagination
- Chart.js bar, line, pie chart
- Invoice printable dan export PDF dengan QR invoice real
- Export laporan CSV/XLSX/PDF, termasuk PDF server-side dari `/api/reports?format=pdf`
- Filter laporan berdasarkan tanggal, metode pembayaran, status, dan paket
- Global search deep-link ke record terkait di halaman pelanggan, paket, antrian, pembayaran, dan user
- Halaman Settings admin menyimpan nama bisnis, alamat, telepon, default range laporan, auto print invoice, dan kapasitas antrian per jam
- Activity log server-side
- Zod validation, server-side input sanitization, bcryptjs password hash
- CSRF protection, login rate limiting, security headers
- Upload guard 2MB untuk jpg/jpeg/png/webp di `lib/security/upload-guard.ts`; gambar gallery publik dibaca dari Supabase Storage
- Favicon, Open Graph image, manifest PWA, icon 192/512, dan screenshot PWA

## Deploy ke Vercel

1. Push project ke GitHub.
2. Import repository di Vercel.
3. Tambahkan environment variables dari `.env.example`.
4. Pastikan Supabase schema sudah dibuat dengan `npm run db:push` atau SQL Editor.
5. Deploy.

Build command: `npm run build`

## Catatan Deploy

Project ini sekarang diposisikan untuk mode online/persisten. Isi seluruh env, jalankan `npm run db:push`, lanjut `npm run db:seed`, lalu build dan start seperti environment deploy. `npm run env:check` memvalidasi format env, koneksi Postgres, dan keberadaan tabel inti.

`ENABLE_DEMO_MODE` hanya disediakan untuk pengujian internal lokal dan test suite, bukan untuk deployment produksi.
