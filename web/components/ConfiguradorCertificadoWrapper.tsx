"use client";

import { ConfiguradorCertificado } from "@/components/ConfiguradorCertificado";
import type { Produto } from "@/lib/produtos";

type Props = {
  produtos: Produto[];
};

export function ConfiguradorCertificadoWrapper({ produtos }: Props) {
  function handleAdd(produto: Produto) {
    // Stub até implementação do carrinho (card futuro)
    console.log("Adicionar ao carrinho:", produto);
  }

  return (
    <ConfiguradorCertificado produtos={produtos} onAdd={handleAdd} />
  );
}
