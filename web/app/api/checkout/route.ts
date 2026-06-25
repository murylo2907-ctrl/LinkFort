import {
  calcularCheckout,
  criarPedido,
  validarCliente,
  validarItensInput,
  type CheckoutRequest,
} from "@/lib/pedidos";
import { isFormaPagamento } from "@/lib/precos";
import { corsHeaders } from "@/lib/cors";
import { NextRequest, NextResponse } from "next/server";

function jsonResponse(request: NextRequest, body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: corsHeaders(request) });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/**
 * Checkout — cálculo de preços e criação de pedido.
 * POST /api/checkout → { acao: "calcular" | "criar", itens, formaPagamento, cupom?, cliente? }
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, { ok: false, erro: "Corpo da requisição inválido." }, 400);
  }

  if (!body || typeof body !== "object") {
    return jsonResponse(request, { ok: false, erro: "Corpo da requisição inválido." }, 400);
  }

  const { acao, itens, formaPagamento, cupom, cliente } = body as CheckoutRequest & Record<string, unknown>;

  if (acao !== "calcular" && acao !== "criar") {
    return jsonResponse(request, { ok: false, erro: 'Ação inválida. Use "calcular" ou "criar".' }, 400);
  }

  if (!isFormaPagamento(formaPagamento)) {
    return jsonResponse(request, { ok: false, erro: "Forma de pagamento inválida." }, 400);
  }

  const itensResult = validarItensInput(itens);
  if (!itensResult.ok) {
    return jsonResponse(request, { ok: false, erro: itensResult.erro }, 400);
  }

  const cupomCodigo = typeof cupom === "string" && cupom.trim() !== "" ? cupom.trim() : undefined;

  try {
    const calculo = await calcularCheckout(itensResult.data, formaPagamento, cupomCodigo);
    if (!calculo.ok) {
      return jsonResponse(request, { ok: false, erro: calculo.erro }, 400);
    }

    if (acao === "calcular") {
      return jsonResponse(request, { ok: true, resumo: calculo.resumo }, 200);
    }

    const clienteResult = validarCliente(cliente);
    if (!clienteResult.ok) {
      return jsonResponse(request, { ok: false, erro: clienteResult.erro }, 400);
    }

    const pedidoResult = await criarPedido(
      clienteResult.data,
      calculo.itens,
      formaPagamento,
      calculo.resumo,
      calculo.cupom
    );

    if (!pedidoResult.ok) {
      return jsonResponse(request, { ok: false, erro: pedidoResult.erro }, 500);
    }

    return jsonResponse(
      request,
      {
        ok: true,
        pedidoId: pedidoResult.pedidoId,
        resumo: calculo.resumo,
        redirectUrl: `/pagamento?pedido=${pedidoResult.pedidoId}`,
      },
      200
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse(request, { ok: false, erro: message }, 500);
  }
}
