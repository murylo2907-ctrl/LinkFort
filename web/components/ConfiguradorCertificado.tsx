"use client";

import { useEffect, useState } from "react";
import {
  encontrarProduto,
  formatarPreco,
  formatarResumo,
  type Produto,
} from "@/lib/produtos";

const TIPOS: { value: Produto["tipo"]; title: string; hint: string }[] = [
  { value: "e-CPF", title: "e-CPF", hint: "Pessoa física" },
  { value: "e-CNPJ", title: "e-CNPJ", hint: "Pessoa jurídica" },
];

const MIDIAS: { value: Produto["midia"]; title: string; hint: string }[] = [
  { value: "A1", title: "A1 — Em arquivo", hint: "Instalado no computador" },
  { value: "Nuvem", title: "Nuvem", hint: "Certificado em nuvem" },
  { value: "A3", title: "A3 — Token / mídia", hint: "Cartão ou pendrive" },
];

const VALIDADES: Produto["validade_anos"][] = [1, 2, 3];

const WHATSAPP_PADRAO = "554130263491";

type Props = {
  produtos: Produto[];
  onAdd: (produto: Produto) => void;
  whatsappNumero?: string;
};

function labelValidade(anos: Produto["validade_anos"]): string {
  return anos === 1 ? "1 ano" : `${anos} anos`;
}

export function ConfiguradorCertificado({
  produtos,
  onAdd,
  whatsappNumero,
}: Props) {
  const [tipo, setTipo] = useState<Produto["tipo"]>("e-CPF");
  const [midia, setMidia] = useState<Produto["midia"]>("A1");
  const [validade, setValidade] = useState<Produto["validade_anos"]>(1);

  const numeroWhatsapp =
    whatsappNumero ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    WHATSAPP_PADRAO;

  const tipoDisponivel = (t: Produto["tipo"]) =>
    produtos.some((p) => p.tipo === t);

  const midiaDisponivel = (m: Produto["midia"]) =>
    produtos.some((p) => p.tipo === tipo && p.midia === m);

  const validadeDisponivel = (v: Produto["validade_anos"]) =>
    Boolean(encontrarProduto(produtos, tipo, midia, v));

  useEffect(() => {
    const disponivel = produtos.some((p) => p.tipo === tipo);
    if (!disponivel) {
      const primeiro = TIPOS.find((t) => produtos.some((p) => p.tipo === t.value));
      if (primeiro) setTipo(primeiro.value);
    }
  }, [produtos, tipo]);

  useEffect(() => {
    const disponivel = produtos.some((p) => p.tipo === tipo && p.midia === midia);
    if (!disponivel) {
      const primeira = MIDIAS.find((m) =>
        produtos.some((p) => p.tipo === tipo && p.midia === m.value)
      );
      if (primeira) setMidia(primeira.value);
    }
  }, [produtos, tipo, midia]);

  useEffect(() => {
    const disponivel = Boolean(encontrarProduto(produtos, tipo, midia, validade));
    if (!disponivel) {
      const primeira = VALIDADES.find((v) =>
        Boolean(encontrarProduto(produtos, tipo, midia, v))
      );
      if (primeira) setValidade(primeira);
    }
  }, [produtos, tipo, midia, validade]);

  const produtoSelecionado = encontrarProduto(produtos, tipo, midia, validade);

  const resumo = formatarResumo(tipo, midia, validade);

  const parcela = produtoSelecionado
    ? formatarPreco(produtoSelecionado.preco / 3)
    : null;

  const textoWhatsapp = produtoSelecionado
    ? `Olá, quero um ${produtoSelecionado.tipo} ${produtoSelecionado.midia} de ${produtoSelecionado.validade_anos} ${produtoSelecionado.validade_anos === 1 ? "ano" : "anos"} (${formatarPreco(produtoSelecionado.preco)})`
    : `Olá, quero informações sobre certificado digital ${tipo} ${midia}`;

  const whatsappHref = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(textoWhatsapp)}`;

  return (
    <section className="quote-section" id="cotador-certificado">
      <div className="container">
        <div className="quote-card">
          <header className="quote-header">
            <p className="quote-eyebrow">Configurador online</p>
            <h2>
              Monte seu <span>certificado digital</span>
            </h2>
            <p className="quote-card__lead">
              Selecione as opções abaixo e veja o valor atualizado em tempo real
              — sem surpresas.
            </p>
            <ul className="quote-trust" aria-label="Diferenciais">
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
                </svg>
                Emissão ICP-Brasil
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
                Preço na hora
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 1a5 5 0 00-5 5v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 7V6a3 3 0 016 0v2H9z" />
                </svg>
                Compra segura
              </li>
            </ul>
          </header>

          <div className="quote-layout">
            <div className="quote-config">
              <div className="quote-step">
                <div className="quote-step__head">
                  <span className="quote-step__num">1</span>
                  <span className="quote-field__label">Tipo de certificado</span>
                </div>
                <div
                  className="quote-options"
                  role="group"
                  aria-label="Tipo de certificado"
                >
                  {TIPOS.map((opcao) => (
                    <button
                      key={opcao.value}
                      type="button"
                      className="quote-option"
                      aria-pressed={tipo === opcao.value}
                      disabled={!tipoDisponivel(opcao.value)}
                      onClick={() => setTipo(opcao.value)}
                    >
                      <span className="quote-option__title">{opcao.title}</span>
                      <span className="quote-option__hint">{opcao.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="quote-step quote-step--model">
                <div className="quote-step__head">
                  <span className="quote-step__num">2</span>
                  <span className="quote-field__label">Mídia</span>
                </div>
                <div
                  className="quote-options quote-options--models"
                  role="group"
                  aria-label="Mídia"
                >
                  {MIDIAS.map((opcao) => (
                    <button
                      key={opcao.value}
                      type="button"
                      className="quote-option"
                      aria-pressed={midia === opcao.value}
                      disabled={!midiaDisponivel(opcao.value)}
                      onClick={() => setMidia(opcao.value)}
                    >
                      <span className="quote-option__title">{opcao.title}</span>
                      <span className="quote-option__hint">{opcao.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="quote-step">
                <div className="quote-step__head">
                  <span className="quote-step__num">3</span>
                  <span className="quote-field__label">Validade</span>
                </div>
                <div
                  className="quote-options quote-options--years"
                  role="group"
                  aria-label="Validade"
                >
                  {VALIDADES.map((anos) => (
                    <button
                      key={anos}
                      type="button"
                      className="quote-option"
                      aria-pressed={validade === anos}
                      disabled={!validadeDisponivel(anos)}
                      onClick={() => setValidade(anos)}
                    >
                      <span className="quote-option__title">
                        {labelValidade(anos)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <aside className="quote-sidebar">
              <div className="quote-result" aria-live="polite">
                <p className="quote-result__label">Sua configuração</p>
                <p className="quote-summary">{resumo}</p>
                <div className="quote-price-wrap">
                  <span className="quote-price-label">Total</span>
                  {produtoSelecionado ? (
                    <p className="quote-price">
                      {formatarPreco(produtoSelecionado.preco)}
                    </p>
                  ) : (
                    <p className="quote-unavailable">Consulte nosso time</p>
                  )}
                </div>
                {produtoSelecionado && parcela && (
                  <p className="quote-installment">
                    Em até 3x de {parcela} sem juros · À vista no Pix
                  </p>
                )}
                {produtoSelecionado?.descricao && (
                  <p className="quote-version">{produtoSelecionado.descricao}</p>
                )}
              </div>

              <div className="quote-ctas">
                <button
                  type="button"
                  className={`btn btn-gradient${produtoSelecionado ? "" : " is-disabled"}`}
                  disabled={!produtoSelecionado}
                  onClick={() => produtoSelecionado && onAdd(produtoSelecionado)}
                >
                  Adicionar ao carrinho
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                >
                  Falar no WhatsApp
                </a>
              </div>

              <ul className="quote-sidebar-notes">
                <li>Atendimento humanizado em todo o processo</li>
                <li>Parcelamento em até 3x sem juros</li>
                <li>Valores conforme catálogo vigente</li>
              </ul>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
