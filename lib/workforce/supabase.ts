import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Untyped Supabase service client for Workforce fw_ tables.
 * The fw_ tables are not in FoundriOS's generated Database types,
 * so we use an untyped client to avoid deep type instantiation errors.
 */
export function createWorkforceServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
