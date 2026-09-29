import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database"
import { getSupabasePublicConfig } from "@/lib/supabase/config"

let supabaseClient: SupabaseClient<Database> | null = null

export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const { url, anonKey } = getSupabasePublicConfig()

  supabaseClient = createBrowserClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}
