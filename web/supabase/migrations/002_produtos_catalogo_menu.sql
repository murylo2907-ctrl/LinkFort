-- Alinha tabela produtos com o catálogo do menu (products.json)
-- Execute no SQL Editor do Supabase APÓS 001_produtos.sql

-- Novos tipos (profissionais) e mídias A3 detalhadas
alter table public.produtos drop constraint if exists produtos_tipo_check;
alter table public.produtos add constraint produtos_tipo_check
  check (tipo in ('e-CPF', 'e-CNPJ', 'e-MÉDICO', 'e-ADVOGADO'));

alter table public.produtos drop constraint if exists produtos_midia_check;
alter table public.produtos add constraint produtos_midia_check
  check (midia in ('A1', 'Nuvem', 'A3', 'A3 Token', 'A3 Leitora', 'A3 Sem mídia'));

-- Vínculo com o site estático (WordPress / products.json)
alter table public.produtos add column if not exists slug text;
alter table public.produtos add column if not exists wp_id integer;

create unique index if not exists produtos_slug_unique on public.produtos (slug) where slug is not null;
create unique index if not exists produtos_wp_id_unique on public.produtos (wp_id) where wp_id is not null;
