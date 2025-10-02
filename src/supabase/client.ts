import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfig { url: string; serviceRoleKey: string }
export type SupabaseAdminClient = SupabaseClient;

export function makeAdminClient(config: SupabaseConfig): SupabaseAdminClient {
  const { url, serviceRoleKey } = config;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
