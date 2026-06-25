import { formatarPreco } from "@/lib/produtos";

export type FormaPagamento = "pix" | "cartao" | "boleto";

export type ItemPreco = {
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
};

export type CupomAplicado = {
  codigo: string;
  desconto: number;
  totalAposCupom: number;
} | null;

export type ResultadoPreco = {
  subtotal: number;
  descontoCupom: number;
  descontoPix: number;
  total: number;
  parcelaCartao: number;
  formaPagamento: FormaPagamento;
};

const FORMAS_PAGAMENTO: FormaPagamento[] = ["pix", "cartao", "boleto"];

export function isFormaPagamento(value: unknown): value is FormaPagamento {
  return typeof value === "string" && FORMAS_PAGAMENTO.includes(value as FormaPagamento);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calcularTotal(
  itens: ItemPreco[],
  formaPagamento: FormaPagamento,
  cupom: CupomAplicado
): ResultadoPreco {
  const subtotal = roundMoney(
    itens.reduce((sum, item) => sum + item.precoUnitario * item.quantidade, 0)
  );

  const descontoCupom = cupom ? roundMoney(cupom.desconto) : 0;
  const baseAposCupom = cupom
    ? roundMoney(cupom.totalAposCupom)
    : roundMoney(subtotal - descontoCupom);

  const descontoPix =
    formaPagamento === "pix" ? roundMoney(baseAposCupom * 0.05) : 0;

  const total =
    formaPagamento === "pix"
      ? roundMoney(baseAposCupom - descontoPix)
      : baseAposCupom;

  const parcelaCartao = roundMoney(baseAposCupom / 3);

  return {
    subtotal,
    descontoCupom,
    descontoPix,
    total,
    parcelaCartao,
    formaPagamento,
  };
}

export { formatarPreco };
