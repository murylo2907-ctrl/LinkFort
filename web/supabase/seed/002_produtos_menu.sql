-- Produtos do menu (products.json) — execute após 002_produtos_catalogo_menu.sql
-- Preço = priceMin do site (produtos "variable" usam o valor inicial da faixa)
-- on conflict: atualiza nome, preço, slug e wp_id se já existir a combinação tipo+midia+validade

insert into public.produtos (nome, tipo, midia, validade_anos, preco, descricao, ativo, slug, wp_id)
values
  -- Já existiam no seed 001 (atualiza slug/wp_id para bater com o menu)
  ('e-CPF – A1 | EM ARQUIVO', 'e-CPF', 'A1', 1, 165.00, 'Certificado em arquivo · videoconferência quando apto', true, 'e-cpf-a1-em-arquivo', 744),
  ('e-CNPJ – A1 | EM ARQUIVO', 'e-CNPJ', 'A1', 1, 240.00, 'Certificado em arquivo · videoconferência quando apto', true, 'e-cnpj-a1-em-arquivo', 799),

  -- A3 — variantes do menu (FALTAVAM no banco)
  ('e-CPF – A3 | TOKEN', 'e-CPF', 'A3 Token', 1, 340.00, 'Token USB · validação presencial', true, 'e-cpf-a3-token', 823),
  ('e-CPF – A3 | LEITORA + SMART CARD', 'e-CPF', 'A3 Leitora', 1, 300.00, 'Leitora + smart card · videoconferência quando apto', true, 'e-cpf-a3-leitora-smart-card', 811),
  ('e-CPF – A3 | SEM MÍDIA INCLUSA', 'e-CPF', 'A3 Sem mídia', 1, 280.00, 'Sem mídia inclusa · videoconferência quando apto', true, 'e-cpf-a3-sem-midia-inclusa', 802),
  ('e-CNPJ – A3 | TOKEN', 'e-CNPJ', 'A3 Token', 1, 380.00, 'Token USB · validação presencial', true, 'e-cnpj-a3-token', 829),
  ('e-CNPJ – A3 | LEITORA + SMART CARD', 'e-CNPJ', 'A3 Leitora', 1, 370.00, 'Leitora + smart card · validação presencial', true, 'e-cnpj-a3-leitora-smart-card', 817),
  ('e-CNPJ – A3 | SEM MÍDIA INCLUSA', 'e-CNPJ', 'A3 Sem mídia', 1, 300.00, 'Sem mídia inclusa · videoconferência quando apto', true, 'e-cnpj-a3-sem-midia-inclusa', 805),

  -- Profissionais (FALTAVAM — tipo não existia no schema)
  ('e-MÉDICO – A3', 'e-MÉDICO', 'A3 Sem mídia', 3, 129.90, 'Certificado médico A3 · validação presencial', true, 'e-medico-a3', 841),
  ('e-ADVOGADO – A3', 'e-ADVOGADO', 'A3 Sem mídia', 3, 129.90, 'Certificado advogado A3 · validação presencial', true, 'e-advogado-a3', 835)
on conflict (tipo, midia, validade_anos) do update set
  nome = excluded.nome,
  preco = excluded.preco,
  descricao = excluded.descricao,
  ativo = excluded.ativo,
  slug = excluded.slug,
  wp_id = excluded.wp_id;

-- O seed 001 tinha um "e-CPF A3 — 1 ano" genérico (A3, 280) que duplica o Sem mídia.
-- Desative para não confundir no configurador:
update public.produtos
set ativo = false
where tipo = 'e-CPF' and midia = 'A3' and validade_anos = 1
  and slug is null;

-- Verificação (deve retornar 10 linhas ativas do menu):
-- select slug, wp_id, nome, tipo, midia, validade_anos, preco
-- from public.produtos
-- where slug is not null and ativo = true
-- order by tipo, midia;
