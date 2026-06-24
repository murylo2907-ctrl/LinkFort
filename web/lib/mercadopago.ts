import { MercadoPagoConfig, Payment } from "mercadopago";
import type { PedidoItemRow, PedidoRow } from "@/lib/pedidos";

export type PagamentoPixResult = {
  paymentId: string;
  amount: number;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
  expirationDate?: string;
};

export type PagamentoBoletoResult = {
  paymentId: string;
  amount: number;
  ticketUrl: string;
  barcode?: string;
};

export type PagamentoCartaoResult = {
  paymentId: string;
  amount: number;
  status: string;
  statusDetail: string;
  installments: number;
};

type MpPaymentResponse = {
  id?: number;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  installments?: number;
  date_of_expiration?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  transaction_details?: {
    external_resource_url?: string;
  };
  barcode?: {
    content?: string;
  };
};

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("Configure MERCADOPAGO_ACCESS_TOKEN no .env.local");
  }
  return token;
}

function getMpClient(): Payment {
  const config = new MercadoPagoConfig({
    accessToken: getAccessToken(),
    options: { timeout: 10000 },
  });
  return new Payment(config);
}

export function getPublicKey(): string {
  const key = process.env.MERCADOPAGO_PUBLIC_KEY?.trim();
  if (!key) {
    throw new Error("Configure MERCADOPAGO_PUBLIC_KEY no .env.local");
  }
  return key;
}

function splitNome(nome: string): { first_name: string; last_name: string } {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first_name: "Cliente", last_name: "Cliente" };
  }
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: parts[0] };
  }
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

function buildPayer(pedido: PedidoRow) {
  const { first_name, last_name } = splitNome(pedido.cliente_nome);
  const docType = pedido.cliente_cpf_cnpj.length === 11 ? "CPF" : "CNPJ";

  return {
    email: pedido.cliente_email,
    first_name,
    last_name,
    identification: {
      type: docType,
      number: pedido.cliente_cpf_cnpj,
    },
  };
}

function buildDescription(pedido: PedidoRow, itens: PedidoItemRow[]): string {
  if (itens.length === 1) {
    return `Pedido ${pedido.id.slice(0, 8)} — ${itens[0].nome_snapshot}`;
  }
  return `Pedido ${pedido.id.slice(0, 8)} — ${itens.length} itens`;
}

function buildAdditionalInfo(itens: PedidoItemRow[]) {
  return {
    items: itens.map((item) => ({
      id: item.produto_id,
      title: item.nome_snapshot,
      quantity: item.quantidade,
      unit_price: item.preco_unitario,
    })),
  };
}

function extractMpError(err: unknown): string {
  if (err && typeof err === "object") {
    const mpErr = err as {
      message?: string;
      cause?: Array<{ description?: string; code?: string }>;
    };
    const causeMsg = mpErr.cause?.[0]?.description;
    if (causeMsg) return causeMsg;
    if (mpErr.message) return mpErr.message;
  }
  return "Erro ao processar pagamento no Mercado Pago.";
}

function toPaymentId(id: number | undefined): string {
  if (id == null) {
    throw new Error("Resposta do Mercado Pago sem ID de pagamento.");
  }
  return String(id);
}

export function mapPagamentoPix(response: MpPaymentResponse): PagamentoPixResult {
  const qrCode = response.point_of_interaction?.transaction_data?.qr_code;
  const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64;

  if (!qrCode || !qrCodeBase64) {
    throw new Error("Mercado Pago não retornou dados do QR Code PIX.");
  }

  return {
    paymentId: toPaymentId(response.id),
    amount: response.transaction_amount ?? 0,
    qrCode,
    qrCodeBase64,
    ticketUrl: response.point_of_interaction?.transaction_data?.ticket_url,
    expirationDate: response.date_of_expiration,
  };
}

export function mapPagamentoBoleto(response: MpPaymentResponse): PagamentoBoletoResult {
  const ticketUrl =
    response.transaction_details?.external_resource_url ??
    response.point_of_interaction?.transaction_data?.ticket_url;

  if (!ticketUrl) {
    throw new Error("Mercado Pago não retornou link do boleto.");
  }

  return {
    paymentId: toPaymentId(response.id),
    amount: response.transaction_amount ?? 0,
    ticketUrl,
    barcode: response.barcode?.content,
  };
}

export function mapPagamentoCartao(
  response: MpPaymentResponse,
  installments: number
): PagamentoCartaoResult {
  return {
    paymentId: toPaymentId(response.id),
    amount: response.transaction_amount ?? 0,
    status: response.status ?? "unknown",
    statusDetail: response.status_detail ?? "",
    installments,
  };
}

export async function obterPagamento(
  paymentId: string
): Promise<MpPaymentResponse> {
  const payment = getMpClient();
  return (await payment.get({ id: paymentId })) as MpPaymentResponse;
}

export async function criarPagamentoPix(
  pedido: PedidoRow,
  itens: PedidoItemRow[]
): Promise<PagamentoPixResult> {
  const payment = getMpClient();

  try {
    const response = (await payment.create({
      body: {
        transaction_amount: pedido.total,
        description: buildDescription(pedido, itens),
        payment_method_id: "pix",
        external_reference: pedido.id,
        payer: buildPayer(pedido),
        additional_info: buildAdditionalInfo(itens),
      },
    })) as MpPaymentResponse;

    return mapPagamentoPix(response);
  } catch (err) {
    throw new Error(extractMpError(err));
  }
}

export async function criarPagamentoBoleto(
  pedido: PedidoRow,
  itens: PedidoItemRow[]
): Promise<PagamentoBoletoResult> {
  const payment = getMpClient();

  try {
    const response = (await payment.create({
      body: {
        transaction_amount: pedido.total,
        description: buildDescription(pedido, itens),
        payment_method_id: "bolbradesco",
        external_reference: pedido.id,
        payer: buildPayer(pedido),
        additional_info: buildAdditionalInfo(itens),
      },
    })) as MpPaymentResponse;

    return mapPagamentoBoleto(response);
  } catch (err) {
    throw new Error(extractMpError(err));
  }
}

export async function criarPagamentoCartao(
  pedido: PedidoRow,
  itens: PedidoItemRow[],
  token: string,
  paymentMethodId: string,
  installments: number
): Promise<PagamentoCartaoResult> {
  const payment = getMpClient();

  try {
    const response = (await payment.create({
      body: {
        transaction_amount: pedido.total,
        token,
        description: buildDescription(pedido, itens),
        installments,
        payment_method_id: paymentMethodId,
        external_reference: pedido.id,
        payer: buildPayer(pedido),
        additional_info: buildAdditionalInfo(itens),
      },
    })) as MpPaymentResponse;

    return mapPagamentoCartao(response, installments);
  } catch (err) {
    throw new Error(extractMpError(err));
  }
}

export const MAX_INSTALLMENTS = 3;

export function calcularParcelaSugerida(total: number): number {
  return Math.round((total / MAX_INSTALLMENTS) * 100) / 100;
}
