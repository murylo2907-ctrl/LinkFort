import { createClient } from "@/lib/supabase";
import type { ValidarCupomResponse } from "@/lib/cupons";
import { NextRequest, NextResponse } from "next/server";

const CORS_ORIGIN = process.env.LF_CORS_ORIGIN ?? "*";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: corsHeaders() });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/**
 * Valida cupom de convênio no servidor.
 * POST /api/validar-cupom → { codigo, total }
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ valido: false, erro: "Corpo da requisição inválido." }, 400);
  }

  if (!body || typeof body !== "object") {
    return jsonResponse({ valido: false, erro: "Corpo da requisição inválido." }, 400);
  }

  const { codigo, total } = body as Record<string, unknown>;

  if (typeof codigo !== "string" || codigo.trim() === "" || codigo.length > 50) {
    return jsonResponse({ valido: false, erro: "Informe um código de cupom válido." }, 400);
  }

  if (typeof total !== "number" || !Number.isFinite(total) || total <= 0) {
    return jsonResponse({ valido: false, erro: "Total inválido para aplicar cupom." }, 400);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("validar_cupom", {
      p_codigo: codigo.trim(),
      p_total: total,
    });

    if (error) {
      return jsonResponse({ valido: false, erro: "Erro ao validar cupom." }, 500);
    }

    const result = data as ValidarCupomResponse;

    if (!result || typeof result !== "object" || !("valido" in result)) {
      return jsonResponse({ valido: false, erro: "Resposta inválida do servidor." }, 500);
    }

    if (!result.valido) {
      return jsonResponse(result, 400);
    }

    return jsonResponse(result, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse({ valido: false, erro: message }, 500);
  }
}
