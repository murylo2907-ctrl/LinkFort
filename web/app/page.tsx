import { createClient } from "@/lib/supabase";

async function checkSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { ok: false, error: message };
  }
}

export default async function Home() {
  const supabaseStatus = await checkSupabaseConnection();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16">
      <main className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          App Next.js — backend e-commerce
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          Em desenvolvimento
        </h1>
        <p className="mt-4 text-zinc-600">
          O site público roda em{" "}
          <code className="rounded bg-zinc-100 px-1">npm run dev</code> (loja
          estática). Este app Next.js será usado para checkout, carrinho e APIs.
        </p>

        <div className="mt-8 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-700">Conexão Supabase</p>
          <p
            className={`mt-1 text-sm ${
              supabaseStatus.ok ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {supabaseStatus.ok
              ? "Conectado"
              : `Falha — ${supabaseStatus.error ?? "verifique o .env.local"}`}
          </p>
        </div>

        <ul className="mt-8 space-y-2 text-sm text-zinc-600">
          <li>
            Site completo + configurador:{" "}
            <code className="rounded bg-zinc-100 px-1">npm run dev</code> →{" "}
            <code className="rounded bg-zinc-100 px-1">/loja.html</code>
          </li>
          <li>
            App Next.js:{" "}
            <code className="rounded bg-zinc-100 px-1">npm run dev:next</code>
          </li>
        </ul>
      </main>
    </div>
  );
}
