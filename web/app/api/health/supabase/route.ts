import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * Health check da conexão com o Supabase.
 * GET /api/health/supabase → { ok: true } ou { ok: false, error: "..." }
 */
export async function GET() {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
