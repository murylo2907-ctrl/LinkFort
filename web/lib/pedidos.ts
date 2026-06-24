import { createClient } from "@/lib/supabase";
import type { ValidarCupomResponse } from "@/lib/cupons";
import { isValidarCupomValido } from "@/lib/cupons";
import {
  calcularTotal,
  type CupomAplicado,
  type FormaPagamento,
  type ItemPreco,
  type ResultadoPreco,
} from "@/lib/precos";
import type { Produto } from "@/lib/produtos";

export type ItemPedidoInput = {
  id: string;
  quantidade: number;
};

export type ClienteInput = {
  nome: string;
  cpfCnpj: string;
  email: string;
  whatsapp: string;
};

export type ItemPedidoResolvido = ItemPreco & {
  nome: string;
};

export type CheckoutCalcularRequest = {
  acao: "calcular";
  itens: ItemPedidoInput[];
  formaPagamento: FormaPagamento;
  cupom?: string;
};

export type CheckoutCriarRequest = {
  acao: "criar";
  itens: ItemPedidoInput[];
  formaPagamento: FormaPagamento;
  cupom?: string;
  cliente: ClienteInput;
};

export type CheckoutRequest = CheckoutCalcularRequest | CheckoutCriarRequest;

export type CheckoutCalcularResponse = {
  ok: true;
  resumo: ResultadoPreco;
};

export type CheckoutCriarResponse = {
  ok: true;
  pedidoId: string;
  resumo: ResultadoPreco;
  redirectUrl: string;
};

export type CheckoutErrorResponse = {
  ok: false;
  erro: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function validarCliente(cliente: unknown): { ok: true; data: ClienteInput } | { ok: false; erro: string } {
  if (!cliente || typeof cliente !== "object") {
    return { ok: false, erro: "Dados do cliente inválidos." };
  }

  const { nome, cpfCnpj, email, whatsapp } = cliente as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length < 2 || nome.trim().length > 200) {
    return { ok: false, erro: "Informe um nome válido." };
  }

  if (typeof cpfCnpj !== "string") {
    return { ok: false, erro: "Informe um CPF ou CNPJ válido." };
  }

  const cpfCnpjDigits = onlyDigits(cpfCnpj);
  if (cpfCnpjDigits.length !== 11 && cpfCnpjDigits.length !== 14) {
    return { ok: false, erro: "CPF deve ter 11 dígitos ou CNPJ 14 dígitos." };
  }

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { ok: false, erro: "Informe um e-mail válido." };
  }

  if (typeof whatsapp !== "string") {
    return { ok: false, erro: "Informe um WhatsApp válido." };
  }

  const whatsappDigits = onlyDigits(whatsapp);
  if (whatsappDigits.length < 10 || whatsappDigits.length > 13) {
    return { ok: false, erro: "Informe um WhatsApp válido com DDD." };
  }

  return {
    ok: true,
    data: {
      nome: nome.trim(),
      cpfCnpj: cpfCnpjDigits,
      email: email.trim().toLowerCase(),
      whatsapp: whatsappDigits,
    },
  };
}

export function validarItensInput(itens: unknown): { ok: true; data: ItemPedidoInput[] } | { ok: false; erro: string } {
  if (!Array.isArray(itens) || itens.length === 0) {
    return { ok: false, erro: "Informe ao menos um item no pedido." };
  }

  const parsed: ItemPedidoInput[] = [];

  for (const item of itens) {
    if (!item || typeof item !== "object") {
      return { ok: false, erro: "Item do pedido inválido." };
    }

    const { id, quantidade } = item as Record<string, unknown>;

    if (typeof id !== "string" || !UUID_REGEX.test(id)) {
      return { ok: false, erro: "ID de produto inválido." };
    }

    if (typeof quantidade !== "number" || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
      return { ok: false, erro: "Quantidade inválida para um dos itens." };
    }

    parsed.push({ id, quantidade });
  }

  return { ok: true, data: parsed };
}

type ProdutoRow = Omit<Produto, "preco"> & { preco: string | number };

function mapProduto(row: ProdutoRow): Produto {
  return {
    ...row,
    preco: typeof row.preco === "string" ? parseFloat(row.preco) : row.preco,
  };
}

export async function resolverItensComPrecos(
  itens: ItemPedidoInput[]
): Promise<{ ok: true; data: ItemPedidoResolvido[] } | { ok: false; erro: string }> {
  const ids = Array.from(new Set(itens.map((i) => i.id)));
  const supabase = createClient();

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .in("id", ids)
    .eq("ativo", true);

  if (error) {
    return { ok: false, erro: "Erro ao buscar produtos." };
  }

  const produtos = new Map((data ?? []).map((row) => [row.id, mapProduto(row as ProdutoRow)]));

  const resolved: ItemPedidoResolvido[] = [];

  for (const item of itens) {
    const produto = produtos.get(item.id);
    if (!produto) {
      return { ok: false, erro: "Um ou mais produtos não foram encontrados ou estão indisponíveis." };
    }

    resolved.push({
      produtoId: produto.id,
      quantidade: item.quantidade,
      precoUnitario: produto.preco,
      nome: produto.nome,
    });
  }

  return { ok: true, data: resolved };
}

export async function aplicarCupomServidor(
  codigo: string | undefined,
  subtotal: number
): Promise<{ ok: true; cupom: CupomAplicado } | { ok: false; erro: string }> {
  if (!codigo || codigo.trim() === "") {
    return { ok: true, cupom: null };
  }

  if (codigo.length > 50) {
    return { ok: false, erro: "Código de cupom inválido." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("validar_cupom", {
    p_codigo: codigo.trim(),
    p_total: subtotal,
  });

  if (error) {
    return { ok: false, erro: "Erro ao validar cupom." };
  }

  const result = data as ValidarCupomResponse;

  if (!result || typeof result !== "object" || !("valido" in result)) {
    return { ok: false, erro: "Resposta inválida ao validar cupom." };
  }

  if (!isValidarCupomValido(result)) {
    return { ok: false, erro: result.erro || "Cupom inválido ou expirado." };
  }

  return {
    ok: true,
    cupom: {
      codigo: result.codigo,
      desconto: result.desconto,
      totalAposCupom: result.total_final,
    },
  };
}

export async function calcularCheckout(
  itens: ItemPedidoInput[],
  formaPagamento: FormaPagamento,
  cupomCodigo?: string
): Promise<{ ok: true; resumo: ResultadoPreco; itens: ItemPedidoResolvido[]; cupom: CupomAplicado } | { ok: false; erro: string }> {
  const itensResult = await resolverItensComPrecos(itens);
  if (!itensResult.ok) {
    return itensResult;
  }

  const resolvedItens = itensResult.data;
  const subtotal = resolvedItens.reduce(
    (sum, item) => sum + item.precoUnitario * item.quantidade,
    0
  );

  const cupomResult = await aplicarCupomServidor(cupomCodigo, subtotal);
  if (!cupomResult.ok) {
    return cupomResult;
  }

  const resumo = calcularTotal(resolvedItens, formaPagamento, cupomResult.cupom);

  return {
    ok: true,
    resumo,
    itens: resolvedItens,
    cupom: cupomResult.cupom,
  };
}

export async function criarPedido(
  cliente: ClienteInput,
  itens: ItemPedidoResolvido[],
  formaPagamento: FormaPagamento,
  resumo: ResultadoPreco,
  cupom: CupomAplicado
): Promise<{ ok: true; pedidoId: string } | { ok: false; erro: string }> {
  const supabase = createClient();
  const pedidoId = crypto.randomUUID();

  const { error: pedidoError } = await supabase.from("pedidos").insert({
    id: pedidoId,
    status: "pendente",
    cliente_nome: cliente.nome,
    cliente_cpf_cnpj: cliente.cpfCnpj,
    cliente_email: cliente.email,
    cliente_whatsapp: cliente.whatsapp,
    forma_pagamento: formaPagamento,
    subtotal: resumo.subtotal,
    desconto_cupom: resumo.descontoCupom,
    desconto_pix: resumo.descontoPix,
    total: resumo.total,
    cupom_codigo: cupom?.codigo ?? null,
  });

  if (pedidoError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[criarPedido] pedidos:", pedidoError.message);
    }
    return { ok: false, erro: "Erro ao criar pedido." };
  }

  const itensInsert = itens.map((item) => ({
    pedido_id: pedidoId,
    produto_id: item.produtoId,
    quantidade: item.quantidade,
    preco_unitario: item.precoUnitario,
    nome_snapshot: item.nome,
  }));

  const { error: itensError } = await supabase.from("pedido_itens").insert(itensInsert);

  if (itensError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[criarPedido] pedido_itens:", itensError.message);
    }
    await supabase.from("pedidos").delete().eq("id", pedidoId);
    return { ok: false, erro: "Erro ao registrar itens do pedido." };
  }

  return { ok: true, pedidoId };
}
