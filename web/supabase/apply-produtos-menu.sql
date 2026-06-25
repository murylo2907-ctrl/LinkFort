-- Cole TUDO no SQL Editor do Supabase (após apply-produtos.sql ou 001)
-- Alinha o banco com os 10 produtos do menu do site

-- === Migration 002 ===
alter table public.produtos drop constraint if exists produtos_tipo_check;
alter table public.produtos add constraint produtos_tipo_check
  check (tipo in ('e-CPF', 'e-CNPJ', 'e-MÉDICO', 'e-ADVOGADO'));

alter table public.produtos drop constraint if exists produtos_midia_check;
alter table public.produtos add constraint produtos_midia_check
  check (midia in ('A1', 'Nuvem', 'A3', 'A3 Token', 'A3 Leitora', 'A3 Sem mídia'));

alter table public.produtos add column if not exists slug text;
alter table public.produtos add column if not exists wp_id integer;

create unique index if not exists produtos_slug_unique on public.produtos (slug) where slug is not null;
create unique index if not exists produtos_wp_id_unique on public.produtos (wp_id) where wp_id is not null;

-- === Seed menu (10 produtos) ===
insert into public.produtos (nome, tipo, midia, validade_anos, preco, descricao, ativo, slug, wp_id)
values
  ('e-CPF – A1 | EM ARQUIVO', 'e-CPF', 'A1', 1, 165.00, 'Certificado em arquivo · videoconferência quando apto', true, 'e-cpf-a1-em-arquivo', 744),
  ('e-CNPJ – A1 | EM ARQUIVO', 'e-CNPJ', 'A1', 1, 240.00, 'Certificado em arquivo · videoconferência quando apto', true, 'e-cnpj-a1-em-arquivo', 799),
  ('e-CPF – A3 | TOKEN', 'e-CPF', 'A3 Token', 1, 340.00, 'Token USB · validação presencial', true, 'e-cpf-a3-token', 823),
  ('e-CPF – A3 | LEITORA + SMART CARD', 'e-CPF', 'A3 Leitora', 1, 300.00, 'Leitora + smart card · videoconferência quando apto', true, 'e-cpf-a3-leitora-smart-card', 811),
  ('e-CPF – A3 | SEM MÍDIA INCLUSA', 'e-CPF', 'A3 Sem mídia', 1, 280.00, 'Sem mídia inclusa · videoconferência quando apto', true, 'e-cpf-a3-sem-midia-inclusa', 802),
  ('e-CNPJ – A3 | TOKEN', 'e-CNPJ', 'A3 Token', 1, 380.00, 'Token USB · validação presencial', true, 'e-cnpj-a3-token', 829),
  ('e-CNPJ – A3 | LEITORA + SMART CARD', 'e-CNPJ', 'A3 Leitora', 1, 370.00, 'Leitora + smart card · validação presencial', true, 'e-cnpj-a3-leitora-smart-card', 817),
  ('e-CNPJ – A3 | SEM MÍDIA INCLUSA', 'e-CNPJ', 'A3 Sem mídia', 1, 300.00, 'Sem mídia inclusa · videoconferência quando apto', true, 'e-cnpj-a3-sem-midia-inclusa', 805),
  ('e-MÉDICO – A3', 'e-MÉDICO', 'A3 Sem mídia', 3, 129.90, 'Certificado médico A3 · validação presencial', true, 'e-medico-a3', 841),
  ('e-ADVOGADO – A3', 'e-ADVOGADO', 'A3 Sem mídia', 3, 129.90, 'Certificado advogado A3 · validação presencial', true, 'e-advogado-a3', 835)
on conflict (tipo, midia, validade_anos) do update set
  nome = excluded.nome,
  preco = excluded.preco,
  descricao = excluded.descricao,
  ativo = excluded.ativo,
  slug = excluded.slug,
  wp_id = excluded.wp_id;

update public.produtos
set ativo = false
where tipo = 'e-CPF' and midia = 'A3' and validade_anos = 1 and slug is null;

-- Conferência:
select slug, wp_id, nome, tipo, midia, validade_anos, preco, ativo
from public.produtos
where slug is not null
order by tipo, midia, validade_anos;
