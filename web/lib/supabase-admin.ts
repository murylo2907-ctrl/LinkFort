import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service_role — bypassa RLS.
 * Uso exclusivo em rotas API server-side (ex.: leitura de pedidos para pagamento).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local"
    );
  }

  if (!serviceKey.startsWith("eyJ") && !serviceKey.startsWith("sb_secret_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY inválida — use a service_role key do painel Supabase."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
