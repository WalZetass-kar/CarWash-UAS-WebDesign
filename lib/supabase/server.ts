import { createClient } from "@supabase/supabase-js";
import { isDemoFixtureModeEnabled } from "@/drizzle/db";
import { getSupabaseAdminKey, getSupabaseUrl } from "@/lib/runtime/supabase-config";

export function createSupabaseAdminClient() {
  if (isDemoFixtureModeEnabled()) {
    return null;
  }

  const url = getSupabaseUrl();
  const serviceRole = getSupabaseAdminKey();

  if (!url || !serviceRole) return null;

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
    },
  });
}
