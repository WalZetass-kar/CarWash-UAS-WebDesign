"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener("cleanride:queue-updated", refresh);
    window.addEventListener("cleanride:payment-updated", refresh);
    return () => {
      window.removeEventListener("cleanride:queue-updated", refresh);
      window.removeEventListener("cleanride:payment-updated", refresh);
    };
  }, [router]);

  return null;
}
