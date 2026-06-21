"use client";

import { motion, useScroll, useTransform, type Variants } from "framer-motion";
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
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { APP_NAME } from "@/lib/constants";
import type { WashPackage } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

const navItems = [
  { href: "#layanan", label: "Layanan" },
  { href: "#paket", label: "Paket" },
  { href: "#gallery", label: "Gallery" },
  { href: "#faq", label: "FAQ" },
];

type LandingPackageCard = {
  slug: string;
  name: string;
  price: number;
  time: string;
  items: string[];
  featured?: boolean;
};

function packageSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toLandingPackageCards(packages: WashPackage[]): LandingPackageCard[] {
  if (!packages.length) return [];

  return packages.slice(0, 6).map((item, index) => {
    const descriptionItems = item.description
      .split(/[,.]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 3);

    return {
      slug: packageSlug(item.name),
      name: item.name,
      price: Number(item.price),
      time: `${item.estimatedMinutes} menit`,
      items: descriptionItems.length
        ? descriptionItems
        : [`Estimasi ${item.estimatedMinutes} menit`, "Antrian digital", "Invoice siap cetak"],
      featured: index === 1,
    };
  });
}

function MotionSection({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: smoothEase,
    },
  },
};

const packageAccentTones = [
  "from-cyan-500 to-sky-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
] as const;

const heroBackgroundImage =
  "https://images.unsplash.com/photo-1680533749371-59c49b31fd74?auto=format&fit=crop&w=1800&q=80&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzgxNDI4MjMyfA";

function getPackageAccent(index: number) {
  return packageAccentTones[index % packageAccentTones.length];
}

function getGalleryTileClass(index: number) {
  switch (index % 6) {
    case 0:
      return "sm:col-span-2 lg:col-span-6 lg:row-span-2 aspect-[4/5] lg:aspect-auto";
    case 1:
      return "sm:col-span-1 lg:col-span-3 aspect-[4/3]";
    case 2:
      return "sm:col-span-1 lg:col-span-3 aspect-[4/3]";
    case 3:
      return "sm:col-span-1 lg:col-span-4 aspect-[4/3]";
    case 4:
      return "sm:col-span-1 lg:col-span-4 aspect-[4/3]";
    default:
      return "sm:col-span-1 lg:col-span-4 aspect-[4/3]";
  }
}

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="overflow-hidden p-5 transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-slate-900/50"
      initial={false}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left font-semibold transition-colors duration-300 hover:text-cyan-700 dark:hover:text-cyan-300"
      >
        <span>{question}</span>
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 text-cyan-600 dark:text-cyan-400"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? 12 : 0,
        }}
        transition={{
          height: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.3, delay: isOpen ? 0.1 : 0 },
          marginTop: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        }}
        className="overflow-hidden"
      >
        <motion.p
          initial={false}
          animate={{
            y: isOpen ? 0 : -10,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm leading-6 text-slate-500 dark:text-slate-400"
        >
          {answer}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export function LandingPage({
  brandName = APP_NAME,
  packages = [],
  gallery = [],
}: {
  brandName?: string;
  packages?: WashPackage[];
  gallery?: string[];
}) {
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(
    scrollYProgress,
    [0, 0.1],
    ["rgba(15, 23, 42, 0.7)", "rgba(15, 23, 42, 0.95)"]
  );
  const packageCards = toLandingPackageCards(packages);
  const galleryImages = gallery;
  const activePackageCount = packageCards.length;
  const startingPackagePrice = packageCards.length
    ? Math.min(...packageCards.map((item) => item.price))
    : null;

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <motion.header 
        className="fixed inset-x-0 top-0 z-50 border-b border-slate-700/60 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/80"
        style={{ backgroundColor: headerBg }}
        initial={false}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-2 font-semibold text-white dark:text-white">
            <motion.span 
              className="grid size-9 place-items-center rounded-lg bg-cyan-600 text-white shadow-lg shadow-cyan-900/20"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Car className="size-5" />
            </motion.span>
            <span className="transition-colors duration-300 group-hover:text-cyan-300">{brandName}</span>
          </Link>

          <div className="hidden items-center gap-6 lg:gap-8 md:flex">
            {navItems.map((item, index) => (
              <motion.a 
                key={item.href} 
                href={item.href} 
                className="relative text-sm font-medium text-white transition-colors duration-300 hover:text-cyan-300 dark:text-slate-300 dark:hover:text-cyan-300"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -2 }}
              >
                {item.label}
                <motion.span
                  className="absolute -bottom-1 left-0 h-0.5 w-0 bg-cyan-400 transition-all duration-300"
                  whileHover={{ width: "100%" }}
                />
              </motion.a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild className="bg-cyan-600 text-white transition-all duration-300 hover:bg-cyan-700 hover:shadow-lg hover:shadow-cyan-600/30">
                <Link href="/booking">
                  Booking Sekarang
                </Link>
              </Button>
            </motion.div>
          </div>

          <motion.button
            className="grid size-10 place-items-center rounded-lg border border-slate-600 text-white transition-all duration-300 hover:border-cyan-500 hover:bg-cyan-950/30 md:hidden dark:border-slate-800 dark:hover:border-cyan-600 dark:hover:bg-cyan-950/30"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </motion.div>
          </motion.button>
        </nav>
        <motion.div
          initial={false}
          animate={{ 
            height: open ? "auto" : 0,
            opacity: open ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden border-t border-slate-700 bg-slate-900 md:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex flex-col gap-2 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {navItems.map((item, index) => (
              <motion.a 
                key={item.href} 
                href={item.href} 
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-slate-800 hover:pl-5 hover:text-cyan-300 dark:text-slate-200 dark:hover:bg-slate-900"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </motion.a>
            ))}
            <Button asChild className="w-full">
              <Link href="/booking">Booking Sekarang</Link>
            </Button>
          </div>
        </motion.div>
      </motion.header>

      <main>
        <section className="relative isolate min-h-[92vh] overflow-hidden pt-16">
          <Image
            src={heroBackgroundImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.2),_transparent_32%),linear-gradient(135deg,_rgba(2,6,23,0.78)_0%,_rgba(15,23,42,0.66)_45%,_rgba(8,47,73,0.62)_100%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
          <motion.div
            className="absolute -left-20 top-20 size-72 rounded-full bg-cyan-400/20 blur-3xl"
            animate={{ x: [0, 18, 0], y: [0, -12, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-0 top-32 size-80 rounded-full bg-blue-500/20 blur-3xl"
            animate={{ x: [0, -16, 0], y: [0, 18, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative mx-auto flex min-h-[92vh] max-w-7xl items-center px-4 pb-20 pt-12 sm:px-6 lg:px-8">
            <motion.div
              className="max-w-3xl text-white"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
              >
                <Badge className="mb-5 border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-50 ring-1 ring-cyan-300/20 transition-all duration-300 hover:bg-cyan-400/20 hover:scale-[1.02]">
                  <Sparkles className="mr-1 size-3 animate-pulse" />
                  Foto cuci mobil nyata
                </Badge>
              </motion.div>
              <motion.h1
                className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                {brandName}
              </motion.h1>
              <motion.p
                className="mt-5 max-w-2xl text-sm leading-7 text-cyan-50/90 sm:text-base sm:leading-8 lg:text-lg"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Booking publik, antrian realtime, pembayaran, invoice, laporan, dan pengaturan admin digabung di satu
                sistem. Halaman ini sekarang menampilkan foto operasional cuci mobil, bukan panel dashboard dummy.
              </motion.p>
              <motion.div
                className="mt-8 flex flex-col gap-3 sm:flex-row"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    size="lg"
                    className="group w-full bg-cyan-600 shadow-xl shadow-cyan-600/30 transition-all duration-300 hover:bg-cyan-500 hover:shadow-2xl hover:shadow-cyan-500/40 sm:w-auto"
                  >
                    <Link href="/booking">
                      Booking Sekarang
                      <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/20 sm:w-auto"
                  >
                    <a href="#paket">Lihat Paket</a>
                  </Button>
                </motion.div>
              </motion.div>
              <motion.div
                className="mt-10 grid max-w-xl grid-cols-1 gap-3 text-xs sm:grid-cols-3 sm:text-sm"
                variants={containerVariants}
                initial={false}
                animate="visible"
              >
                {["Booking publik", "Realtime queue", "Invoice cetak"].map((item) => (
                  <motion.div
                    key={item}
                    className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-center font-medium text-white/90 backdrop-blur-sm transition-all duration-300 hover:border-cyan-300/50 hover:bg-white/20 hover:shadow-lg hover:shadow-cyan-500/20"
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                  >
                    {item}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        <MotionSection id="layanan" className="mx-auto max-w-7xl px-4 py-16 sm:py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Badge className="transition-all duration-300 hover:scale-105">About Service</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Standar cuci kendaraan yang cepat, bersih, dan transparan.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
                Kilap Kendaraan menggabungkan layanan premium dengan sistem operasional digital: pelanggan bisa diproses lebih cepat, status kendaraan mudah dipantau, dan laporan langsung siap dipresentasikan.
              </p>
            </motion.div>
            <motion.div 
              className="grid gap-4 sm:grid-cols-2"
              variants={containerVariants}
              initial={false}
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                { icon: Droplets, title: "Foam wash premium", desc: "Chemical aman untuk cat dan detailing ringan.", color: "text-blue-600" },
                { icon: Clock, title: "Estimasi akurat", desc: "Waktu pengerjaan tercatat di antrian digital.", color: "text-amber-600" },
                { icon: ShieldCheck, title: "Data aman", desc: "JWT, HTTPOnly cookies, RBAC, dan validasi server.", color: "text-emerald-600" },
                { icon: BadgeCheck, title: "Invoice siap cetak", desc: "Pembayaran dan bukti transaksi langsung terdokumentasi.", color: "text-purple-600" },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="group h-full cursor-default border-slate-200 transition-all duration-300 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-600/10 dark:border-slate-800 dark:hover:border-cyan-700">
                    <CardContent className="pt-5">
                      <motion.div
                        className="inline-block"
                        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      >
                        <item.icon className={`mb-4 size-7 transition-colors duration-300 ${item.color} group-hover:text-cyan-600`} />
                      </motion.div>
                      <h3 className="font-semibold transition-colors duration-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </MotionSection>

        <MotionSection id="paket" className="bg-gradient-to-b from-white via-slate-50 to-cyan-50/40 py-16 sm:py-20 dark:from-slate-900/40 dark:via-slate-900/60 dark:to-slate-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <motion.div
                className="max-w-2xl"
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <Badge className="transition-all duration-300 hover:scale-105">Paket Pencucian</Badge>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  Pilihan paket untuk kebutuhan harian sampai detailing.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Setiap paket diambil dari data Supabase, jadi harga, estimasi, dan detail layanan tetap sinkron dengan
                  dashboard operasional.
                </p>
              </motion.div>
              <motion.div
                className="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]"
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 }}
              >
                <div className="rounded-2xl border border-cyan-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-cyan-400/20 dark:bg-slate-900/80">
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">Paket aktif</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{activePackageCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Mulai dari</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                    {startingPackagePrice !== null ? formatCurrency(startingPackagePrice) : "-"}
                  </p>
                </div>
              </motion.div>
            </div>
            {packageCards.length ? (
              <motion.div
                className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial={false}
                whileInView="visible"
                viewport={{ once: true }}
              >
                {packageCards.map((item, index) => {
                  const accent = getPackageAccent(index);
                  return (
                    <motion.div
                      key={item.name}
                      variants={itemVariants}
                      whileHover={{ y: -12, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        className={`group relative h-full overflow-hidden border-slate-200 bg-white/90 shadow-sm transition-all duration-300 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-600/10 dark:border-slate-800 dark:bg-slate-950/80 dark:hover:border-cyan-700 ${
                          item.featured ? "ring-1 ring-cyan-200/70 dark:ring-cyan-400/20" : ""
                        }`}
                      >
                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
                        <div
                          className={`absolute right-4 top-4 size-24 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-3xl`}
                        />
                        <CardContent className="relative pt-7">
                          {item.featured ? (
                            <motion.div
                              initial={false}
                              whileInView={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <Badge className={`mb-4 bg-gradient-to-r ${accent} text-slate-950`}>
                                Paling dipilih
                              </Badge>
                            </motion.div>
                          ) : null}
                          <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-cyan-700 sm:text-xl dark:group-hover:text-cyan-300">
                            {item.name}
                          </h3>
                          <div className="mt-3 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                Estimasi
                              </p>
                              <span className="mt-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                                {item.time}
                              </span>
                            </div>
                            <span className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-2xl font-semibold tracking-tight text-slate-950 transition-colors duration-300 group-hover:border-cyan-200 group-hover:text-cyan-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:group-hover:text-cyan-300">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                          <ul className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                            {item.items.map((feature, idx) => (
                              <motion.li
                                key={feature}
                                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                                initial={false}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                              >
                                <CheckCircle2 className="size-4 flex-shrink-0 text-emerald-500 transition-transform duration-300 group-hover:scale-110" />
                                {feature}
                              </motion.li>
                            ))}
                          </ul>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              asChild
                              className={`mt-6 w-full bg-gradient-to-r ${accent} text-slate-950 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-600/30`}
                            >
                              <Link href={`/booking?package=${item.slug}`}>
                                Pilih Paket
                                <ArrowRight className="ml-2 size-4" />
                              </Link>
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <EmptyState
                title="Paket masih kosong"
                description="Tidak ada paket aktif di Supabase saat ini."
                className="mt-10 mx-auto max-w-2xl border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60"
              />
            )}
          </div>
        </MotionSection>

        <MotionSection className="mx-auto max-w-7xl px-4 py-16 sm:py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Badge className="transition-all duration-300 hover:scale-105">Operasional Nyata</Badge>
              <h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Tanpa angka palsu, tanpa testimoni fiktif, fokus ke alur kerja yang benar-benar dipakai.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
                Semua yang tampil di web ini berasal dari fitur aktif: booking publik, antrian realtime, pembayaran,
                invoice, laporan, dan pengaturan admin. Kalau data kosong, halaman akan jujur menampilkan state kosong.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/booking">
                    Booking Sekarang
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/aksesadmincarwash">Masuk Dashboard</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              className="grid gap-4 sm:grid-cols-2"
              variants={containerVariants}
              initial={false}
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: Car,
                  title: "Booking publik",
                  desc: "Pelanggan bisa pesan jadwal tanpa login dan langsung masuk ke alur antrian.",
                },
                {
                  icon: Clock,
                  title: "Realtime queue",
                  desc: "Status antrian bergerak saat petugas update dari dashboard Supabase.",
                },
                {
                  icon: BadgeCheck,
                  title: "Pembayaran & invoice",
                  desc: "Transaksi lunas, struk printable, dan ekspor laporan ditangani di satu tempat.",
                },
                {
                  icon: ShieldCheck,
                  title: "Admin access",
                  desc: "Role-based access menjaga dashboard, pengaturan, dan data operasional tetap aman.",
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="group h-full cursor-default border-slate-200 transition-all duration-300 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-600/10 dark:border-slate-800 dark:hover:border-cyan-700">
                    <CardContent className="pt-5">
                      <motion.div
                        className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                        whileHover={{ rotate: [0, -8, 8, 0], scale: 1.05 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <item.icon className="size-5" />
                      </motion.div>
                      <h3 className="font-semibold transition-colors duration-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </MotionSection>

        <MotionSection id="gallery" className="mx-auto max-w-7xl px-4 py-16 sm:py-20 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <motion.div
              className="max-w-2xl"
              initial={false}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Badge className="transition-all duration-300 hover:scale-105">Gallery</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Hasil layanan Kilap Kendaraan
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Dokumentasi visual ditarik langsung dari Supabase Storage agar apa yang ditampilkan tetap akurat.
              </p>
            </motion.div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
              <div className="rounded-2xl border border-cyan-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-cyan-400/20 dark:bg-slate-900/80">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">Foto aktif</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{galleryImages.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Sumber</p>
                <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">Supabase Storage</p>
              </div>
            </div>
          </div>
          {galleryImages.length ? (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[180px]"
              variants={containerVariants}
              initial={false}
              whileInView="visible"
              viewport={{ once: true }}
            >
              {galleryImages.map((src, index) => (
                <motion.div
                  key={src}
                  className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-lg shadow-slate-950/5 ${getGalleryTileClass(index)}`}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent opacity-100 transition-opacity duration-300 sm:opacity-90 sm:group-hover:opacity-100"
                  />
                  <Image
                    src={src}
                    alt={`Gallery Kilap Kendaraan ${index + 1}`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                  />
                  <motion.div
                    className="absolute inset-x-4 bottom-4 z-20 text-white opacity-100 transition-opacity duration-300"
                    initial={{ y: 20 }}
                    whileHover={{ y: 0 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/70">Dokumentasi</p>
                        <p className="mt-1 text-sm font-semibold">Gallery #{index + 1}</p>
                      </div>
                      <Badge className="border-white/20 bg-white/10 text-white">Supabase</Badge>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              title="Gallery masih kosong"
              description="Belum ada data gallery dari Supabase saat ini."
              className="mx-auto max-w-2xl border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60"
            />
          )}
        </MotionSection>

        <MotionSection id="faq" className="bg-white py-16 sm:py-20 dark:bg-slate-900/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Badge className="transition-all duration-300 hover:scale-105">FAQ</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Pertanyaan umum</h2>
            </motion.div>
            <motion.div 
              className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {[
                ["Apakah bisa booking online?", "Bisa. Pengunjung publik dapat memilih paket dan membuat booking tanpa login dari halaman booking."],
                ["Apakah status antrian realtime?", "Ya. Aplikasi sudah menyiapkan Supabase Realtime untuk sinkronisasi antrian dan transaksi."],
                ["Apakah laporan bisa diekspor?", "Admin dapat ekspor CSV, PDF, dan XLSX dari halaman laporan."],
              ].map(([question, answer], index) => (
                <FAQItem key={question} question={question} answer={answer} index={index} />
              ))}
            </motion.div>
          </div>
        </MotionSection>
      </main>

      <motion.footer 
        className="border-t border-slate-200 bg-slate-950 py-10 text-white dark:border-slate-800"
        initial={false}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 text-center sm:px-6 md:flex-row md:items-center md:text-left lg:px-8">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="group flex items-center gap-2 font-semibold"
            >
              <motion.div
                className="relative inline-block size-6 overflow-hidden rounded"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image src="/logo.png" alt="Logo" fill sizes="24px" className="object-cover" />
              </motion.div>
              <span className="transition-colors duration-300 group-hover:text-cyan-300">{brandName}</span>
            </motion.div>
            <p className="mt-2 text-sm text-slate-400">
              Booking, antrian, pembayaran, dan laporan terhubung ke Supabase live.
            </p>
          </motion.div>
          <motion.div 
            className="text-sm text-slate-400 md:text-right"
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            © 2026 {brandName}. All rights reserved.
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}
