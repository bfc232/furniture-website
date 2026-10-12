import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, hasSupabaseConfig } from "@/lib/supabase/env";

export { hasSupabaseConfig };

export function createServiceSupabase() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role environment variables are missing.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

