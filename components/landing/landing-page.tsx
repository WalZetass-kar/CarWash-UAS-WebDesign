"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Car,
  CheckCircle2,
  Clock,
  Droplets,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const navItems = [
  { href: "#layanan", label: "Layanan" },
  { href: "#paket", label: "Paket" },
  { href: "#gallery", label: "Gallery" },
  { href: "#faq", label: "FAQ" },
];

const packages = [
  {
    name: "Express Wash",
    price: 35000,
    time: "25 menit",
    items: ["Snow wash", "Bilas tekanan tinggi", "Lap microfiber"],
  },
  {
    name: "Premium Gloss",
    price: 85000,
    time: "55 menit",
    items: ["Vacuum interior", "Semir ban", "Wax kilap"],
    featured: true,
  },
  {
    name: "Detailing Care",
    price: 175000,
    time: "120 menit",
    items: ["Deep clean", "Coating ringan", "Finishing premium"],
  },
];

const gallery = [
  "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600320254374-ce2d293c324e?auto=format&fit=crop&w=900&q=80",
];

function MotionSection({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

export function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/82 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/78">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-lg bg-cyan-600 text-white shadow-lg shadow-cyan-900/20">
              <Car className="size-5" />
            </span>
            <span>{APP_NAME}</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button asChild variant="ghost">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Booking Sekarang</Link>
            </Button>
          </div>

          <button
            className="grid size-10 place-items-center rounded-lg border border-slate-200 md:hidden dark:border-slate-800"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>
        {open ? (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900">
                  {item.label}
                </a>
              ))}
              <Button asChild className="mt-2">
                <Link href="/login">Booking Sekarang</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative min-h-[92vh] pt-16">
          <Image
            src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1800&q=85"
            alt="Mobil premium setelah dicuci di CleanRide"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/44 to-cyan-950/10" />
          <div className="relative mx-auto flex min-h-[92vh] max-w-7xl items-center px-4 pb-20 pt-12 sm:px-6 lg:px-8">
            <motion.div
              className="max-w-3xl text-white"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              <Badge className="mb-5 bg-white/14 text-cyan-50 ring-white/20">
                <Sparkles className="mr-1 size-3" />
                Premium wash, realtime queue, fast payment
              </Badge>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                CleanRide Car Wash
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-cyan-50/90 sm:text-lg">
                Booking, antrian, pembayaran, invoice, laporan, dan dashboard operasional dalam satu aplikasi modern untuk layanan cuci kendaraan yang rapi dan profesional.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/login">
                    Booking Sekarang <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/[0.18]">
                  <a href="#paket">Lihat Paket</a>
                </Button>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-sm text-white/88">
                {["Realtime Queue", "Secure Payment", "Printable Invoice"].map((item) => (
                  <div key={item} className="glass-panel rounded-lg px-3 py-3 text-center text-white">
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <MotionSection id="layanan" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge>About Service</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Standar cuci kendaraan yang cepat, bersih, dan transparan.</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                CleanRide menggabungkan layanan premium dengan sistem operasional digital: pelanggan bisa diproses lebih cepat, status kendaraan mudah dipantau, dan laporan langsung siap dipresentasikan.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Droplets, title: "Foam wash premium", desc: "Chemical aman untuk cat dan detailing ringan." },
                { icon: Clock, title: "Estimasi akurat", desc: "Waktu pengerjaan tercatat di antrian digital." },
                { icon: ShieldCheck, title: "Data aman", desc: "JWT, HTTPOnly cookies, RBAC, dan validasi server." },
                { icon: BadgeCheck, title: "Invoice siap cetak", desc: "Pembayaran dan bukti transaksi langsung terdokumentasi." },
              ].map((item) => (
                <Card key={item.title} className="transition hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="pt-5">
                    <item.icon className="mb-4 size-7 text-cyan-600" />
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </MotionSection>

        <MotionSection id="paket" className="bg-white py-20 dark:bg-slate-900/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <Badge>Paket Pencucian</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Pilihan paket untuk kebutuhan harian sampai detailing.</h2>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {packages.map((item) => (
                <Card key={item.name} className={item.featured ? "border-cyan-300 shadow-xl shadow-cyan-900/10" : ""}>
                  <CardContent className="pt-6">
                    {item.featured ? <Badge className="mb-4">Paling Populer</Badge> : null}
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-3xl font-semibold">{formatCurrency(item.price)}</span>
                      <span className="pb-1 text-sm text-slate-500">{item.time}</span>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {item.items.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-6 w-full">
                      <Link href="/login">Pilih Paket</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </MotionSection>

        <MotionSection className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1.250+", "Kendaraan dicuci"],
              ["98%", "Kepuasan pelanggan"],
              ["12 menit", "Rata-rata check-in"],
              ["24/7", "Dashboard siap pantau"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
                <div className="text-3xl font-semibold text-cyan-700 dark:text-cyan-300">{value}</div>
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </MotionSection>

        <MotionSection className="bg-slate-950 py-20 text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              ["Rizky Pratama", "Mobil terlihat baru lagi. Proses cepat dan invoice langsung dikirim."],
              ["Nadia Putri", "Antrian jelas, petugas responsif, dan dashboard booking terasa profesional."],
              ["Fajar Maulana", "Paket motor shine rapi. Cocok untuk langganan mingguan."],
            ].map(([name, text]) => (
              <Card key={name} className="border-white/10 bg-white/[0.08] text-white">
                <CardContent className="pt-6">
                  <div className="mb-4 flex gap-1 text-amber-300">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-slate-200">{text}</p>
                  <p className="mt-5 font-semibold">{name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </MotionSection>

        <MotionSection id="gallery" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge>Gallery</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Hasil layanan CleanRide</h2>
            </div>
            <Skeleton className="hidden h-10 w-44 sm:block" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {gallery.map((src, index) => (
              <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                  src={src}
                  alt={`Gallery CleanRide ${index + 1}`}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </MotionSection>

        <MotionSection id="faq" className="bg-white py-20 dark:bg-slate-900/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Badge>FAQ</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Pertanyaan umum</h2>
            <div className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
              {[
                ["Apakah bisa booking online?", "Bisa. CTA akan membawa pengguna ke login dashboard untuk input booking dan antrian."],
                ["Apakah status antrian realtime?", "Ya. Aplikasi sudah menyiapkan Supabase Realtime untuk sinkronisasi antrian dan transaksi."],
                ["Apakah laporan bisa diekspor?", "Admin dapat ekspor CSV dan PDF dari halaman laporan."],
              ].map(([question, answer]) => (
                <details key={question} className="group p-5">
                  <summary className="cursor-pointer list-none font-semibold">{question}</summary>
                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </MotionSection>
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 py-10 text-white dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Car className="size-5 text-cyan-300" />
              {APP_NAME}
            </div>
            <p className="mt-2 text-sm text-slate-400">Premium car wash management for Web Design UAS project.</p>
          </div>
          <div className="text-sm text-slate-400">© 2026 CleanRide. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
