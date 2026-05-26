import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminKey, getSupabaseUrl } from "@/lib/runtime/supabase-config";

export function createSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const serviceRole = getSupabaseAdminKey();

  if (!url || !serviceRole) return null;

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
    },
  });
}
