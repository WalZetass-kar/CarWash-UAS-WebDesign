"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function RealtimeStatus() {
  const [connected, setConnected] = useState(false);
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const configured = Boolean(supabase);
  const desktopLabel = connected ? "Realtime" : configured ? "Offline" : "Belum Terkonfigurasi";
  const mobileLabel = connected ? "Live" : configured ? "Off" : "Setup";

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("kilapkendaraan-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, () => {
        window.dispatchEvent(new CustomEvent("kilapkendaraan:queue-updated"));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        window.dispatchEvent(new CustomEvent("kilapkendaraan:payment-updated"));
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold",
        connected
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
          : configured
            ? "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {connected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
      <span className="sm:hidden">{mobileLabel}</span>
      <span className="hidden sm:inline">{desktopLabel}</span>
    </span>
  );
}
