# Checklist: produtos do menu vs banco Supabase

## Situação antes da migration 002

| Item | Status |
|------|--------|
| Menu (`products.json`) | 10 produtos |
| Seed 001 (`apply-produtos.sql`) | 10 produtos genéricos (configurador) |
| Sobreposição com menu | Só **2** (e-CPF A1 e e-CNPJ A1) |
| Tipos no banco | Só `e-CPF` e `e-CNPJ` |
| Mídias no banco | Só `A1`, `Nuvem`, `A3` (sem Token/Leitora/Sem mídia) |
| IDs do carrinho (páginas de produto) | Números WordPress (744, 799…) — API exige UUID |

## O que faltava cadastrar (8 produtos)

| # | Nome no menu | wp_id | tipo | midia | validade | preço (priceMin) |
|---|--------------|-------|------|-------|----------|------------------|
| 1 | e-CPF – A3 \| TOKEN | 823 | e-CPF | A3 Token | 1 ano | R$ 340,00 |
| 2 | e-CPF – A3 \| LEITORA + SMART CARD | 811 | e-CPF | A3 Leitora | 1 ano | R$ 300,00 |
| 3 | e-CPF – A3 \| SEM MÍDIA INCLUSA | 802 | e-CPF | A3 Sem mídia | 1 ano | R$ 280,00 |
| 4 | e-CNPJ – A3 \| TOKEN | 829 | e-CNPJ | A3 Token | 1 ano | R$ 380,00 |
| 5 | e-CNPJ – A3 \| LEITORA + SMART CARD | 817 | e-CNPJ | A3 Leitora | 1 ano | R$ 370,00 |
| 6 | e-CNPJ – A3 \| SEM MÍDIA INCLUSA | 805 | e-CNPJ | A3 Sem mídia | 1 ano | R$ 300,00 |
| 7 | e-MÉDICO – A3 | 841 | e-MÉDICO | A3 Sem mídia | 3 anos | R$ 129,90 |
| 8 | e-ADVOGADO – A3 | 835 | e-ADVOGADO | A3 Sem mídia | 3 anos | R$ 129,90 |

## Já existiam (só precisam de slug/wp_id)

| Nome | wp_id | Seed 001 equivalente |
|------|-------|----------------------|
| e-CPF – A1 \| EM ARQUIVO | 744 | e-CPF A1 — 1 ano (R$ 165) |
| e-CNPJ – A1 \| EM ARQUIVO | 799 | e-CNPJ A1 — 1 ano (R$ 240) |

## Produtos no seed 001 que NÃO estão no menu (podem manter para o configurador)

- e-CPF A1 — 2 e 3 anos
- e-CPF Nuvem — 1 e 2 anos
- e-CNPJ Nuvem — 1 e 3 anos
- e-CPF A3 — 1 ano (genérico, **desativado** pelo seed 002)
- e-CNPJ A3 — 2 anos

## Como aplicar no Supabase

1. SQL Editor → colar e executar `migrations/002_produtos_catalogo_menu.sql`
2. SQL Editor → colar e executar `seed/002_produtos_menu.sql`
3. Conferir:

```sql
select slug, wp_id, nome, tipo, midia, validade_anos, preco, ativo
from public.produtos
where slug is not null
order by tipo, midia, validade_anos;
```

Deve listar **10 linhas** (todas do menu).

## Atenção: erro de ID no checkout

Cadastrar no banco **não resolve sozinho** o erro `ID de produto inválido` quando o cliente compra pela **página do produto** (menu → produto → carrinho). O carrinho ainda guarda `wp_id` (744, 799…) e a API espera **UUID**.

Depois de rodar o SQL, será necessário no código:
- mapear `wp_id` → UUID do Supabase ao adicionar ao carrinho, **ou**
- enviar `slug` e resolver no backend

## Faixas de preço (variable)

Produtos com `priceMin` ≠ `priceMax` no site usam o **priceMin** no banco. Se quiser cobrar pelo máximo ou por validade (2y/3y), cadastre linhas extras com `validade_anos` 2 ou 3.
