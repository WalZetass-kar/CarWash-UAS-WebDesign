"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useEffectEvent } from "react";

export function RealtimeRefresh() {
  const router = useRouter();
  const pathname = usePathname();

  const refreshRoute = useEffectEvent(() => {
    if (pathname.startsWith("/dashboard/queues") || pathname.startsWith("/dashboard/payments")) {
      return;
    }
    router.refresh();
  });

  useEffect(() => {
    const refresh = () => refreshRoute();
    window.addEventListener("cleanride:queue-updated", refresh);
    window.addEventListener("cleanride:payment-updated", refresh);
    return () => {
      window.removeEventListener("cleanride:queue-updated", refresh);
      window.removeEventListener("cleanride:payment-updated", refresh);
    };
  }, []);

  return null;
}
