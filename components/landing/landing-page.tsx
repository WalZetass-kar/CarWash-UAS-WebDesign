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
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

const fallbackPackages: LandingPackageCard[] = [
  {
    slug: "express-wash",
    name: "Express Wash",
    price: 35000,
    time: "25 menit",
    items: ["Snow wash", "Bilas tekanan tinggi", "Lap microfiber"],
  },
  {
    slug: "premium-gloss",
    name: "Premium Gloss",
    price: 85000,
    time: "55 menit",
    items: ["Vacuum interior", "Semir ban", "Wax kilap"],
    featured: true,
  },
  {
    slug: "detailing-care",
    name: "Detailing Care",
    price: 175000,
    time: "120 menit",
    items: ["Deep clean", "Coating ringan", "Finishing premium"],
  },
];

const fallbackGallery = [
  "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600320254374-ce2d293c324e?auto=format&fit=crop&w=900&q=80",
];

function packageSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toLandingPackageCards(packages: WashPackage[]): LandingPackageCard[] {
  if (!packages.length) return fallbackPackages;

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
  gallery = fallbackGallery,
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
  const galleryImages = gallery.length ? gallery : fallbackGallery;

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
              <Button asChild variant="ghost" className="text-white transition-all duration-300 hover:bg-white/10 hover:text-cyan-300 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white">
                <Link href="/login">Masuk</Link>
              </Button>
            </motion.div>
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
            <Button asChild variant="ghost" className="mt-2 border border-slate-700 text-white hover:bg-slate-800">
              <Link href="/login" onClick={() => setOpen(false)}>Masuk Dashboard</Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/booking">Booking Sekarang</Link>
            </Button>
          </div>
        </motion.div>
      </motion.header>

      <main>
        <section className="relative min-h-[92vh] pt-16 overflow-hidden">
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1800&q=85"
              alt="Mobil premium setelah dicuci di CleanRide"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-cyan-950/20" />
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
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Badge className="mb-5 bg-white/14 text-cyan-50 ring-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105">
                  <Sparkles className="mr-1 size-3 animate-pulse" />
                  Premium wash, realtime queue, fast payment
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
                Booking, antrian, pembayaran, invoice, laporan, dan dashboard operasional dalam satu aplikasi modern untuk layanan cuci kendaraan yang rapi dan profesional.
              </motion.p>
              <motion.div 
                className="mt-8 flex flex-col gap-3 sm:flex-row"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild size="lg" className="group w-full sm:w-auto shadow-xl shadow-cyan-600/30 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-600/40">
                    <Link href="/booking">
                      Booking Sekarang 
                      <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/50">
                    <a href="#paket">Lihat Paket</a>
                  </Button>
                </motion.div>
              </motion.div>
              <motion.div 
                className="mt-10 grid max-w-xl grid-cols-2 gap-3 text-xs sm:grid-cols-3 sm:text-sm"
                variants={containerVariants}
                initial={false}
                animate="visible"
              >
                {["Realtime Queue", "Secure Payment", "Printable Invoice"].map((item, index) => (
                  <motion.div 
                    key={item} 
                    className={`rounded-lg border border-cyan-500 bg-slate-950/90 px-3 py-3 text-center font-medium text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-cyan-400 hover:bg-slate-900 hover:shadow-lg hover:shadow-cyan-500/30 cursor-default ${
                      index === 2 ? "col-span-2 sm:col-span-1" : ""
                    }`}
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
                CleanRide menggabungkan layanan premium dengan sistem operasional digital: pelanggan bisa diproses lebih cepat, status kendaraan mudah dipantau, dan laporan langsung siap dipresentasikan.
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

        <MotionSection id="paket" className="bg-white py-16 sm:py-20 dark:bg-slate-900/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="max-w-2xl"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Badge className="transition-all duration-300 hover:scale-105">Paket Pencucian</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Pilihan paket untuk kebutuhan harian sampai detailing.</h2>
            </motion.div>
            <motion.div 
              className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial={false}
              whileInView="visible"
              viewport={{ once: true }}
            >
              {packageCards.map((item) => (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`group h-full cursor-default transition-all duration-300 ${
                    item.featured 
                      ? "border-cyan-300 shadow-xl shadow-cyan-600/20 hover:shadow-2xl hover:shadow-cyan-600/30 dark:border-cyan-700" 
                      : "border-slate-200 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-600/10 dark:border-slate-800 dark:hover:border-cyan-800"
                  }`}>
                    <CardContent className="pt-6">
                      {item.featured ? (
                        <motion.div
                          initial={false}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Badge className="mb-4 animate-pulse bg-gradient-to-r from-cyan-600 to-blue-600">Paling Populer</Badge>
                        </motion.div>
                      ) : null}
                      <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-cyan-700 sm:text-xl dark:group-hover:text-cyan-300">{item.name}</h3>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-2xl font-semibold transition-colors duration-300 group-hover:text-cyan-600 sm:text-3xl">{formatCurrency(item.price)}</span>
                        <span className="pb-1 text-xs text-slate-500 sm:text-sm">{item.time}</span>
                      </div>
                      <ul className="mt-6 space-y-3">
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
                        <Button asChild className="mt-6 w-full transition-all duration-300 hover:shadow-lg hover:shadow-cyan-600/30">
                          <Link href={`/booking?package=${item.slug}`}>Pilih Paket</Link>
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </MotionSection>

        <MotionSection className="mx-auto max-w-7xl px-4 py-16 sm:py-20 sm:px-6 lg:px-8">
          <motion.div 
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              ["1.250+", "Kendaraan dicuci"],
              ["98%", "Kepuasan pelanggan"],
              ["12 menit", "Rata-rata check-in"],
              ["24/7", "Dashboard siap pantau"],
            ].map(([value, label], index) => (
              <motion.div 
                key={label} 
                className="group cursor-default rounded-lg border border-slate-200 bg-white p-6 text-center transition-all duration-300 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-600/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-700"
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.05 }}
              >
                <motion.div 
                  className="text-2xl font-semibold text-cyan-700 transition-all duration-300 group-hover:scale-110 sm:text-3xl dark:text-cyan-300"
                  initial={false}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                >
                  {value}
                </motion.div>
                <div className="mt-2 text-xs text-slate-500 sm:text-sm dark:text-slate-400">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </MotionSection>

        <MotionSection className="bg-slate-950 py-16 text-white sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:gap-6 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              ["Rizky Pratama", "Mobil terlihat baru lagi. Proses cepat dan invoice langsung dikirim."],
              ["Nadia Putri", "Antrian jelas, petugas responsif, dan dashboard booking terasa profesional."],
              ["Fajar Maulana", "Paket motor shine rapi. Cocok untuk langganan mingguan."],
            ].map(([name, text], index) => (
              <motion.div
                key={name}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="group h-full cursor-default border-white/10 bg-white/[0.08] text-white transition-all duration-300 hover:border-white/30 hover:bg-white/[0.12] hover:shadow-2xl hover:shadow-cyan-600/20">
                  <CardContent className="pt-6">
                    <motion.div 
                      className="mb-4 flex gap-1 text-amber-300"
                      initial={false}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 + 0.3, duration: 0.5 }}
                    >
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <motion.div
                          key={starIndex}
                          initial={false}
                          whileInView={{ opacity: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.15 + starIndex * 0.05, duration: 0.4 }}
                          whileHover={{ scale: 1.2, rotate: 360 }}
                        >
                          <Star className="size-4 fill-current" />
                        </motion.div>
                      ))}
                    </motion.div>
                    <p className="text-sm leading-6 text-slate-200">{text}</p>
                    <p className="mt-5 font-semibold transition-colors duration-300 group-hover:text-cyan-300">{name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </MotionSection>

        <MotionSection id="gallery" className="mx-auto max-w-7xl px-4 py-16 sm:py-20 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Badge className="transition-all duration-300 hover:scale-105">Gallery</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Hasil layanan CleanRide</h2>
            </motion.div>
            <Skeleton className="hidden h-10 w-44 sm:block" />
          </div>
          <motion.div 
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
          >
            {galleryImages.map((src, index) => (
              <motion.div 
                key={src} 
                className="group relative aspect-[4/3] overflow-hidden rounded-lg"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100"
                />
                <Image
                  src={src}
                  alt={`Gallery CleanRide ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                />
                <motion.div
                  className="absolute bottom-4 left-4 z-20 text-white opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100"
                  initial={{ y: 20 }}
                  whileHover={{ y: 0 }}
                >
                  <p className="text-sm font-semibold">Gallery #{index + 1}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
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
                className="inline-block"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <Car className="size-5 text-cyan-300 transition-colors duration-300 group-hover:text-cyan-400" />
              </motion.div>
              <span className="transition-colors duration-300 group-hover:text-cyan-300">{brandName}</span>
            </motion.div>
            <p className="mt-2 text-sm text-slate-400">Premium car wash management for Web Design UAS project.</p>
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
