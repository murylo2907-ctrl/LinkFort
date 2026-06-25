
import {
  atualizarPagamentoMercadoPago,
  buscarPedidoParaPagamento,
  isValidPedidoId,
  type PedidoParaPagamento,
} from "@/lib/pedidos";
import {
  calcularParcelaSugerida,
  criarPagamentoBoleto,
  criarPagamentoCartao,
  criarPagamentoPix,
  getPublicKey,
  mapPagamentoBoleto,
  mapPagamentoCartao,
  mapPagamentoPix,
  MAX_INSTALLMENTS,
  obterPagamento,
} from "@/lib/mercadopago";
import { corsHeaders } from "@/lib/cors";
import { NextRequest, NextResponse } from "next/server";

type PagamentoRequest = {
  pedidoId?: string;
  acao?: "criar" | "confirmar";
  token?: string;
  paymentMethodId?: string;
  installments?: number;
};

function jsonResponse(request: NextRequest, body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: corsHeaders(request) });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

async function reutilizarPagamentoExistente(
  pedidoData: PedidoParaPagamento
): Promise<Record<string, unknown> | null> {
  const { pedido } = pedidoData;
  if (!pedido.mp_payment_id) return null;

  try {
    const existing = await obterPagamento(pedido.mp_payment_id);

    if (pedido.forma_pagamento === "pix") {
      const pix = mapPagamentoPix(existing);
      return {
        ok: true,
        forma: "pix",
        paymentId: pix.paymentId,
        amount: pix.amount,
        qrCode: pix.qrCode,
        qrCodeBase64: pix.qrCodeBase64,
        ticketUrl: pix.ticketUrl,
        expirationDate: pix.expirationDate,
        reutilizado: true,
      };
    }

    if (pedido.forma_pagamento === "boleto") {
      const boleto = mapPagamentoBoleto(existing);
      return {
        ok: true,
        forma: "boleto",
        paymentId: boleto.paymentId,
        amount: boleto.amount,
        ticketUrl: boleto.ticketUrl,
        barcode: boleto.barcode,
        reutilizado: true,
      };
    }

    if (pedido.forma_pagamento === "cartao") {
      const installments = existing.installments ?? 1;
      const cartao = mapPagamentoCartao(existing, installments);
      return {
        ok: true,
        forma: "cartao",
        paymentId: cartao.paymentId,
        amount: cartao.amount,
        status: cartao.status,
        statusDetail: cartao.statusDetail,
        installments: cartao.installments,
        reutilizado: true,
      };
    }
  } catch {
    return null;
  }

  return null;
}

async function handleCriar(
  request: NextRequest,
  pedidoData: PedidoParaPagamento
) {
  const { pedido, itens } = pedidoData;

  const existente = await reutilizarPagamentoExistente(pedidoData);
  if (existente) {
    return jsonResponse(request, existente, 200);
  }

  if (pedido.forma_pagamento === "pix") {
    const pix = await criarPagamentoPix(pedido, itens);
    const update = await atualizarPagamentoMercadoPago(pedido.id, pix.paymentId, "pending");
    if (!update.ok) {
      return jsonResponse(request, { ok: false, erro: update.erro }, 500);
    }

    return jsonResponse(
      request,
      {
        ok: true,
        forma: "pix",
        paymentId: pix.paymentId,
        amount: pix.amount,
        qrCode: pix.qrCode,
        qrCodeBase64: pix.qrCodeBase64,
        ticketUrl: pix.ticketUrl,
        expirationDate: pix.expirationDate,
      },
      200
    );
  }

  if (pedido.forma_pagamento === "boleto") {
    const boleto = await criarPagamentoBoleto(pedido, itens);
    const update = await atualizarPagamentoMercadoPago(pedido.id, boleto.paymentId, "pending");
    if (!update.ok) {
      return jsonResponse(request, { ok: false, erro: update.erro }, 500);
    }

    return jsonResponse(
      request,
      {
        ok: true,
        forma: "boleto",
        paymentId: boleto.paymentId,
        amount: boleto.amount,
        ticketUrl: boleto.ticketUrl,
        barcode: boleto.barcode,
      },
      200
    );
  }

  if (pedido.forma_pagamento === "cartao") {
    return jsonResponse(
      request,
      {
        ok: true,
        forma: "cartao",
        amount: pedido.total,
        publicKey: getPublicKey(),
        maxInstallments: MAX_INSTALLMENTS,
        parcelaSugerida: calcularParcelaSugerida(pedido.total),
      },
      200
    );
  }

  return jsonResponse(request, { ok: false, erro: "Forma de pagamento não suportada." }, 400);
}

async function handleConfirmar(
  request: NextRequest,
  pedidoData: PedidoParaPagamento,
  body: PagamentoRequest
) {
  const { pedido, itens } = pedidoData;

  if (pedido.forma_pagamento !== "cartao") {
    return jsonResponse(
      request,
      { ok: false, erro: 'Ação "confirmar" é válida apenas para pagamento com cartão.' },
      400
    );
  }

  const existente = await reutilizarPagamentoExistente(pedidoData);
  if (existente) {
    return jsonResponse(request, existente, 200);
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const paymentMethodId =
    typeof body.paymentMethodId === "string" ? body.paymentMethodId.trim() : "";

  if (!token) {
    return jsonResponse(request, { ok: false, erro: "Token do cartão é obrigatório." }, 400);
  }

  if (!paymentMethodId) {
    return jsonResponse(
      request,
      { ok: false, erro: "paymentMethodId é obrigatório (ex.: visa, master)." },
      400
    );
  }

  const installments =
    typeof body.installments === "number" && Number.isInteger(body.installments)
      ? body.installments
      : 1;

  if (installments < 1 || installments > MAX_INSTALLMENTS) {
    return jsonResponse(
      request,
      { ok: false, erro: `Parcelas devem ser entre 1 e ${MAX_INSTALLMENTS}.` },
      400
    );
  }

  const cartao = await criarPagamentoCartao(
    pedido,
    itens,
    token,
    paymentMethodId,
    installments
  );

  const update = await atualizarPagamentoMercadoPago(
    pedido.id,
    cartao.paymentId,
    cartao.status
  );
  if (!update.ok) {
    return jsonResponse(request, { ok: false, erro: update.erro }, 500);
  }

  return jsonResponse(
    request,
    {
      ok: true,
      forma: "cartao",
      paymentId: cartao.paymentId,
      amount: cartao.amount,
      status: cartao.status,
      statusDetail: cartao.statusDetail,
      installments: cartao.installments,
    },
    200
  );
}

/**
 * Pagamento — cria cobrança no Mercado Pago a partir de um pedido.
 * POST /api/pagamento → { pedidoId, acao?: "criar" | "confirmar", token?, paymentMethodId?, installments? }
 */
export async function POST(request: NextRequest) {
  let body: PagamentoRequest;

  try {
    body = (await request.json()) as PagamentoRequest;
  } catch {
    return jsonResponse(request, { ok: false, erro: "Corpo da requisição inválido." }, 400);
  }

  const pedidoId = typeof body.pedidoId === "string" ? body.pedidoId.trim() : "";

  if (!pedidoId || !isValidPedidoId(pedidoId)) {
    return jsonResponse(request, { ok: false, erro: "ID do pedido inválido." }, 400);
  }

  const acao = body.acao === "confirmar" ? "confirmar" : "criar";

  const pedidoResult = await buscarPedidoParaPagamento(pedidoId);
  if (!pedidoResult.ok) {
    return jsonResponse(
      request,
      { ok: false, erro: pedidoResult.erro },
      pedidoResult.status ?? 500
    );
  }

  try {
    if (acao === "confirmar") {
      return await handleConfirmar(request, pedidoResult.data, body);
    }
    return await handleCriar(request, pedidoResult.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse(request, { ok: false, erro: message }, 500);
  }
}
