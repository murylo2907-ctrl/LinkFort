import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Factory do cliente Supabase.
 *
 * Passo 1 — Variáveis públicas:
 *   NEXT_PUBLIC_* são lidas do .env.local e podem ser usadas no browser e no servidor.
 *
 * Passo 2 — Validação:
 *   Garante que URL e anon key existem antes de criar o client (evita erros silenciosos).
 *
 * Passo 3 — createClient():
 *   Use esta função em rotas API, Server Components ou Client Components.
 *   A anon key é segura no frontend; permissões reais vêm das RLS policies do Supabase.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local"
    );
  }

  if (anonKey.startsWith("sb_secret_")) {
    throw new Error(
      "Use a anon public key no .env.local — nunca a service_role / secret key."
    );
  }

  return createSupabaseClient(url, anonKey);
}
