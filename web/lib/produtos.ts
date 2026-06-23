import { createClient } from "@/lib/supabase";

export type Produto = {
  id: string;
  nome: string;
  tipo: "e-CPF" | "e-CNPJ";
  midia: "A1" | "Nuvem" | "A3";
  validade_anos: 1 | 2 | 3;
  preco: number;
  descricao: string | null;
  ativo: boolean;
};

type ProdutoRow = Omit<Produto, "preco"> & { preco: string | number };

function mapProduto(row: ProdutoRow): Produto {
  return {
    ...row,
    preco: typeof row.preco === "string" ? parseFloat(row.preco) : row.preco,
  };
}

export async function buscarProdutos(): Promise<Produto[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .order("tipo")
    .order("midia")
    .order("validade_anos");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapProduto);
}
