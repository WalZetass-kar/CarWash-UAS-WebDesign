"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  Bell,
  Car,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackageCheck,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useEffectEvent, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RealtimeStatus } from "@/components/realtime/realtime-status";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import { getResponseMessage } from "@/lib/form-utils";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/jwt";
import { roleLabels } from "@/lib/constants";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: Array<SessionUser["role"]>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["admin", "kasir", "staff", "petugas"] },
  { href: "/dashboard/customers", label: "Pelanggan", icon: Users, roles: ["admin", "petugas"] },
  { href: "/dashboard/packages", label: "Paket", icon: PackageCheck, roles: ["admin", "petugas"] },
  { href: "/dashboard/queues", label: "Antrian", icon: Car, roles: ["admin", "staff", "petugas"] },
  { href: "/dashboard/payments", label: "Pembayaran", icon: CreditCard, roles: ["admin", "kasir", "petugas"] },
  { href: "/dashboard/ai-analysis", label: "Analisis AI", icon: Sparkles, roles: ["admin", "kasir", "staff", "petugas"] },
  { href: "/dashboard/reports", label: "Laporan", icon: FileText, roles: ["admin"] },
  { href: "/dashboard/users", label: "Manajemen User", icon: BarChart3, roles: ["admin"] },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings, roles: ["admin"] },
];

type SearchResult = {
  type: string;
  title: string;
  description: string;
  href: string;
};

function isActiveNav(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const csrfFetch = useCsrfFetch();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const visibleNav = useMemo(
    () => navItems.filter((item) => item.roles.includes(user.role)),
    [user.role],
  );

  const handleSearchResult = useEffectEvent((nextResults: SearchResult[]) => {
    setResults(nextResults);
    setSearchLoading(false);
  });

  useEffect(() => {
    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      if (deferredQuery.trim().length < 2) {
        setSearchLoading(false);
        setResults([]);
        return;
      }

      setSearchLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(deferredQuery)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          handleSearchResult([]);
          return;
        }
        handleSearchResult(await response.json());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        handleSearchResult([]);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [deferredQuery]);

  function requestLogout() {
    setLogoutDialogOpen(true);
  }

  async function logout() {
    setLoggingOut(true);
    const response = await csrfFetch("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    setLoggingOut(false);

    if (!response.ok) {
      toast.error(await getResponseMessage(response, "Logout gagal. Coba lagi."));
      return;
    }

    setLogoutDialogOpen(false);
    toast.success("Logout berhasil");
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <aside className="relative flex h-full w-[18.5rem] flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-white/82 p-4 shadow-[0_32px_90px_-44px_rgba(15,23,42,0.7)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/84 dark:shadow-[0_36px_90px_-42px_rgba(0,0,0,0.9)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_38%)]" />

      <div className="relative flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-cyan-700 text-white shadow-[0_18px_32px_-18px_rgba(8,145,178,0.95)]">
            <Car className="size-5" />
          </span>
          <div>
            <div className="text-sm font-semibold tracking-[0.02em] text-slate-950 dark:text-white">CleanRide</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Operations Suite</div>
          </div>
        </Link>
        <button
          className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup sidebar"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="relative mt-6 rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800/80 dark:bg-slate-900/72">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Realtime workspace</div>
        <div className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          Semua modul operasional CleanRide dalam satu dashboard yang rapi dan fokus.
        </div>
      </div>

      <nav className="relative mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {visibleNav.map((item) => {
          const active = isActiveNav(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-[1.15rem] px-3 py-3 text-sm font-medium transition-all duration-300",
                active
                  ? "bg-gradient-to-r from-cyan-500/14 via-cyan-400/10 to-transparent text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_34px_-28px_rgba(8,145,178,0.7)] dark:text-white"
                  : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900/90 dark:hover:text-white",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
                  active
                    ? "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/12 dark:text-cyan-200"
                    : "border-slate-200 bg-white/90 text-slate-500 group-hover:border-cyan-100 group-hover:text-cyan-700 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400 dark:group-hover:border-cyan-500/20 dark:group-hover:text-cyan-200",
                )}
              >
                <item.icon className="size-4" />
              </span>
              <span className="truncate">{item.label}</span>
              {active ? <span className="absolute inset-y-3 left-0 w-1 rounded-full bg-cyan-500 dark:bg-cyan-300" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-5 rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</div>
        <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
        <Badge className="mt-3" variant={user.role === "admin" ? "default" : "secondary"}>
          {roleLabels[user.role]}
        </Badge>
        <Button variant="outline" size="sm" onClick={requestLogout} className="mt-4 w-full lg:hidden">
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(180deg,#020617_0%,#071122_54%,#020617_100%)]">
      <RealtimeRefresh />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-400/10" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-400/10" />
      </div>

      <div className="fixed inset-y-0 left-0 z-40 hidden p-4 lg:block">{sidebar}</div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup overlay"
          />
          <div className="relative h-full p-4">{sidebar}</div>
        </div>
      ) : null}

      <div className="relative lg:pl-[20rem]">
        <header className="sticky top-0 z-30 border-b border-white/55 bg-white/76 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/76">
          <div className="flex h-20 items-center gap-3 px-4 sm:px-6 xl:px-10">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="size-5" />
            </Button>

            <div className="relative max-w-2xl flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => setQuery(nextValue));
                }}
                placeholder="Cari pelanggan, transaksi, antrian, user..."
                className="h-12 rounded-2xl border-white/60 bg-white/84 pl-11 pr-10 dark:border-slate-800/90 dark:bg-slate-950/78"
              />
              {searchLoading ? (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <LoadingSpinner />
                </div>
              ) : null}
              {results.length > 0 ? (
                <div className="surface-ring absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/92 shadow-[0_28px_80px_-38px_rgba(15,23,42,0.55)] dark:border-slate-800/90 dark:bg-slate-950/94">
                  {results.map((result, index) => (
                    <Link
                      key={`${result.type}-${result.title}`}
                      href={result.href}
                      className="block border-b border-slate-100 px-5 py-4 text-sm transition-colors hover:bg-cyan-50/60 dark:border-slate-900 dark:hover:bg-slate-900"
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{result.title}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {result.type} - {result.description}
                          </div>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          {index + 1}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <RealtimeStatus />
            </div>
            <Button variant="ghost" size="icon" aria-label="Notifikasi">
              <Bell className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="size-5 dark:hidden" />
              <Moon className="hidden size-5 dark:block" />
            </Button>
            <Button variant="outline" size="sm" onClick={requestLogout} className="hidden sm:inline-flex">
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 xl:px-10">{children}</main>
      </div>

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Logout</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin logout? Sesi dashboard saat ini akan diakhiri.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLogoutDialogOpen(false)} disabled={loggingOut}>
              Cancel
            </Button>
            <Button type="button" onClick={logout} disabled={loggingOut}>
              {loggingOut ? <LoadingSpinner className="text-white" /> : null}
              Oke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
