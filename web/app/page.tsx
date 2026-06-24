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
          Site estático em{" "}
          <code className="rounded bg-zinc-100 px-1">http://localhost:3000</code>.
          APIs de checkout e cupons neste app em{" "}
          <code className="rounded bg-zinc-100 px-1">http://localhost:3001</code>.
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
            Site (loja + checkout):{" "}
            <code className="rounded bg-zinc-100 px-1">npm run dev:static</code>{" "}
            →{" "}
            <a href="http://localhost:3000/loja.html" className="text-blue-600 underline">
              http://localhost:3000
            </a>
          </li>
          <li>
            API Next.js:{" "}
            <code className="rounded bg-zinc-100 px-1">npm run dev:next</code>{" "}
            →{" "}
            <code className="rounded bg-zinc-100 px-1">http://localhost:3001</code>
          </li>
          <li>
            Os dois juntos:{" "}
            <code className="rounded bg-zinc-100 px-1">npm run dev:all</code>
          </li>
        </ul>
      </main>
    </div>
  );
}
