# CleanRide Car Wash

Aplikasi web fullstack modern untuk Projek UAS Mata Kuliah Web Design. CleanRide berisi landing page promosi, dashboard admin/petugas, CRUD operasional car wash, realtime queue, laporan, invoice, dan autentikasi JWT berbasis HTTPOnly cookies.

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript
- TailwindCSS 4, shadcn/ui style components, Lucide React Icons
- Framer Motion, Flatpickr, TanStack Table, Chart.js
- Supabase Database + Supabase Realtime
- Drizzle ORM + Drizzle Kit
- Zod, JWT `jose`, bcryptjs, DOMPurify
- HTTPOnly cookies, RBAC middleware, CSRF guard, security headers
- PWA manifest + service worker basic cache
- Vercel deployment ready

## Cara Install

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`.

## Setup Supabase

1. Buat project Supabase.
2. Ambil `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY`.
3. Ambil connection string Postgres dari Project Settings > Database.
4. Isi `.env.local`.
5. Jalankan schema:

```bash
npm run db:push
npm run db:seed
```

Alternatif manual: copy SQL dari `drizzle/0001_initial.sql` ke Supabase SQL Editor.

Untuk upload gallery production, buat bucket Supabase Storage public bernama `cleanride`. API upload akan menyimpan file ke path `gallery/...` bila `SUPABASE_SERVICE_ROLE_KEY` tersedia.

## Drizzle ORM

Schema utama ada di `drizzle/schema.ts`.

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## Akun Demo

- Admin: `admin@cleanride.my.id` / `admin123`
- Petugas: `petugas@cleanride.my.id` / `petugas123`

Jika `DATABASE_URL` belum diisi, aplikasi tetap berjalan memakai data demo in-memory agar presentasi lokal tidak terblokir.

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
- `services`: data access layer Drizzle + fallback demo
- `schemas`: validasi Zod
- `drizzle`: schema, config, migration SQL, seeder
- `actions`, `api`, `middleware`: folder pendukung sesuai requirement
- `proxy.ts`: pengganti modern `middleware.ts` di Next.js 16 untuk auth, RBAC, CSRF cookie, dan security headers

## Fitur

- Landing page responsive dengan hero, CTA, paket, statistik, testimoni, FAQ, gallery, footer
- Login/logout JWT, HTTPOnly cookies, SameSite, route protection via Next.js Proxy atau middleware modern
- Session otomatis tidak valid setelah pergantian tanggal pukul 00:00 Asia/Jakarta
- RBAC admin/petugas di middleware dan API routes
- Dashboard analytics, search global, notification shell, dark/light mode
- CRUD pelanggan, paket, antrian, pembayaran, user
- Edit pelanggan, edit paket, edit/reset password user, dan nonaktifkan user
- Pembayaran memilih transaksi pending dari data antrian/transaksi, bukan input ID manual
- Supabase Realtime untuk queues dan payments
- Dashboard auto-refresh saat event realtime queues/payments masuk
- TanStack Table untuk search, sorting, pagination
- Chart.js bar, line, pie chart
- Invoice printable dan export PDF dengan QR invoice real
- Export laporan CSV/PDF, termasuk PDF server-side dari `/api/reports?format=pdf`
- Activity log server-side
- Zod validation, DOMPurify sanitization, bcryptjs password hash
- CSRF protection, login rate limiting, security headers
- Upload guard 2MB untuk jpg/jpeg/png/webp di `lib/security/upload-guard.ts` dan halaman Settings admin
- Favicon, Open Graph image, manifest PWA, icon 192/512, dan screenshot PWA

## Deploy ke Vercel

1. Push project ke GitHub.
2. Import repository di Vercel.
3. Tambahkan environment variables dari `.env.example`.
4. Pastikan Supabase schema sudah dibuat dengan `npm run db:push` atau SQL Editor.
5. Deploy.

Build command: `npm run build`

## Catatan Presentasi

Mode demo bisa dipakai tanpa Supabase untuk menunjukkan UI dan alur aplikasi. Untuk penyimpanan production, isi env Supabase dan jalankan Drizzle push/seed.
