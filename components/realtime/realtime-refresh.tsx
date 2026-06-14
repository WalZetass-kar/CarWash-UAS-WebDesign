"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent } from "react";

export function RealtimeRefresh() {
  const router = useRouter();

  const refreshRoute = useEffectEvent(() => {
    router.refresh();
  });

  useEffect(() => {
    const refresh = () => refreshRoute();
    window.addEventListener("kilapkendaraan:queue-updated", refresh);
    window.addEventListener("kilapkendaraan:payment-updated", refresh);
    return () => {
      window.removeEventListener("kilapkendaraan:queue-updated", refresh);
      window.removeEventListener("kilapkendaraan:payment-updated", refresh);
    };
  }, []);

  return null;
}
