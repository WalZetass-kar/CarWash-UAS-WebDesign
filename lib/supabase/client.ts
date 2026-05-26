"use client";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseBrowserKey, getSupabaseUrl } from "@/lib/runtime/supabase-config";

export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseBrowserKey();

  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    realtime: {
      params: {
        eventsPerSecond: 8,
      },
    },
  });
}
