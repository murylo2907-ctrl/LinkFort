# Sintra Motos

Plataforma web que moderniza um portal institucional antigo e o transforma em um canal de serviços com **loja virtual**. O recorte implementado é a operação de **certificados digitais ICP-Brasil** (e-CPF, e-CNPJ e certificados profissionais), com regras de negócio reais de catálogo, descontos, checkout e pagamento.

## O problema

Sites institucionais antigos (em geral WordPress/WooCommerce) costumam concentrar conteúdo institucional, mas falham quando o negócio passa a depender de venda online:

- catálogo rígido, sem um configurador que combine tipo, mídia e validade;
- preços e promoções definidos no front, fáceis de manipular;
- cupons de sindicatos e convênios sem validação segura no servidor;
- checkout incompleto ou dependente de um painel que pode ficar inacessível;
- pagamento sem integração nativa com Pix, cartão e boleto;
- falta de um canal para parceiros (indicação, revenda e materiais).

O projeto trata esse cenário: sair de um site estático/legado e chegar a uma plataforma **moderna, segura e focada em serviço**.

## A solução

Uma loja com fluxo completo de compra e um backend que **recalcula tudo no servidor**:

- **Configurador de certificado** — o cliente escolhe tipo (e-CPF / e-CNPJ), mídia (A1, Nuvem, A3 Token/Leitora) e validade (1, 2 ou 3 anos) e vê o preço na hora.
- **Catálogo no banco** — produtos ativos, preços oficiais e regras de combinação tipo + mídia + validade.
- **Cupons de convênio** — desconto percentual ou fixo, validado por RPC no banco (código, validade e valor), sem expor a tabela ao público.
- **Regras de pagamento** — 5% de desconto no Pix; cartão em até 3x; boleto.
- **Checkout e pedidos** — validação de CPF/CNPJ, e-mail e WhatsApp; pedido com status (`pendente`, `pago`, `cancelado`, `expirado`) e snapshot dos itens.
- **Mercado Pago** — Pix (QR Code), boleto e cartão (tokenização no cliente).
- **Portal de parceiros** — cadastro por convite, painel de indicações/comissões e materiais de divulgação, com papéis de admin e parceiro.
- **Site institucional** — páginas de loja, contato, FAQ e conteúdo da empresa, publicáveis em hospedagem estática.

## Tecnologias

| Camada | Tecnologia | Função |
| --- | --- | --- |
| Front da loja | HTML, CSS e JavaScript | Site institucional, catálogo, carrinho, checkout e pagamento |
| API | Next.js 14, React 18 e TypeScript | Checkout, cupons, pedidos e pagamentos |
| Estilo (app) | Tailwind CSS | Interface do app Next.js |
| Banco e auth | Supabase (PostgreSQL) | Produtos, cupons, pedidos, RLS, Auth e portal de parceiros |
| Pagamentos | Mercado Pago | Pix, cartão e boleto |
| Deploy | Vercel | Site estático e APIs |

## Arquitetura

O repositório é um monorepo com duas partes:

1. **`link-forte/site`** — vitrine e jornada de compra (HTML/CSS/JS), servida de forma estática.
2. **`web/`** — backend Next.js (porta 3001 em desenvolvimento) com as rotas:
   - `POST /api/checkout` — calcular totais ou criar pedido
   - `POST /api/validar-cupom` — validar cupom
   - `POST /api/pagamento` — criar/confirmar cobrança no Mercado Pago

Preços, descontos e totais **não são confiados ao navegador**: o servidor busca o produto no banco, aplica o cupom e só então calcula Pix, cartão ou boleto.

## Segurança (visão geral)

- Row Level Security no PostgreSQL (leitura pública só de produtos ativos).
- Validação de cupom via função `security definer`, sem SELECT público na tabela.
- Preços oficiais sempre no servidor.
- Integração de pagamento com token de cartão (o número do cartão não transita no backend da loja).
- Papéis `admin` e `partner` no portal de parceiros.

## Status

Projeto em desenvolvimento ativo: catálogo, checkout, cupons, pedidos e pagamentos já estão modelados e integrados. O app Next.js ainda expõe uma tela de diagnóstico da API; a experiência do cliente roda no site estático da loja.
