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
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white/88 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/88">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-cyan-600 text-white">
            <Car className="size-5" />
          </span>
          CleanRide
        </Link>
        <button
          className="grid size-9 place-items-center rounded-lg hover:bg-slate-100 lg:hidden dark:hover:bg-slate-900"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup sidebar"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="mt-8 space-y-1">
        {visibleNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="text-sm font-semibold">{user.name}</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
        <Badge className="mt-3" variant={user.role === "admin" ? "default" : "secondary"}>
          {roleLabels[user.role]}
        </Badge>
        <Button variant="outline" size="sm" onClick={requestLogout} className="mt-3 w-full lg:hidden">
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <RealtimeRefresh />
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup overlay"
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/82 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/82">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="size-5" />
            </Button>

            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => setQuery(nextValue));
                }}
                placeholder="Cari pelanggan, transaksi, antrian, user..."
                className="pl-9"
              />
              {searchLoading ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoadingSpinner />
                </div>
              ) : null}
              {results.length > 0 ? (
                <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.title}`}
                      href={result.href}
                      className="block border-b border-slate-100 px-4 py-3 text-sm hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900"
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                      }}
                    >
                      <div className="font-semibold">{result.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{result.type} - {result.description}</div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <RealtimeStatus />
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

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
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
