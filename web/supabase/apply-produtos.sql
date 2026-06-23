-- CARD 01 — Cole TUDO no SQL Editor do Supabase e clique em Run
-- Projeto: o mesmo configurado em web/.env.local
-- Seguro para reexecutar: usa IF NOT EXISTS / ON CONFLICT DO NOTHING

-- ---------------------------------------------------------------------------
-- Migration: tabela produtos
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('e-CPF', 'e-CNPJ')),
  midia text not null check (midia in ('A1', 'Nuvem', 'A3')),
  validade_anos int not null check (validade_anos in (1, 2, 3)),
  preco numeric(10, 2) not null check (preco >= 0),
  descricao text,
  ativo boolean not null default true,
  constraint produtos_tipo_midia_validade_unique unique (tipo, midia, validade_anos)
);

create index if not exists produtos_ativo_idx on public.produtos (ativo) where ativo = true;

alter table public.produtos enable row level security;

drop policy if exists "Leitura pública de produtos ativos" on public.produtos;

create policy "Leitura pública de produtos ativos"
  on public.produtos
  for select
  to anon, authenticated
  using (ativo = true);

-- ---------------------------------------------------------------------------
-- Seed: 10 certificados digitais de exemplo
-- ---------------------------------------------------------------------------

insert into public.produtos (nome, tipo, midia, validade_anos, preco, descricao, ativo)
values
  ('e-CPF A1 — 1 ano', 'e-CPF', 'A1', 1, 165.00, 'Arquivo digital com backup', true),
  ('e-CPF A1 — 2 anos', 'e-CPF', 'A1', 2, 222.75, 'Arquivo digital com backup', true),
  ('e-CPF A1 — 3 anos', 'e-CPF', 'A1', 3, 280.50, 'Arquivo digital com backup', true),
  ('e-CNPJ A1 — 1 ano', 'e-CNPJ', 'A1', 1, 240.00, 'Arquivo digital com backup', true),
  ('e-CPF Nuvem — 1 ano', 'e-CPF', 'Nuvem', 1, 189.90, 'Certificado em nuvem, acesso remoto', true),
  ('e-CPF Nuvem — 2 anos', 'e-CPF', 'Nuvem', 2, 259.90, 'Certificado em nuvem, acesso remoto', true),
  ('e-CNPJ Nuvem — 1 ano', 'e-CNPJ', 'Nuvem', 1, 279.90, 'Certificado em nuvem, acesso remoto', true),
  ('e-CPF A3 — 1 ano', 'e-CPF', 'A3', 1, 280.00, 'Token/cartão — validação presencial', true),
  ('e-CNPJ A3 — 2 anos', 'e-CNPJ', 'A3', 2, 320.00, 'Token/cartão — validação presencial', true),
  ('e-CNPJ Nuvem — 3 anos', 'e-CNPJ', 'Nuvem', 3, 449.90, 'Certificado em nuvem, acesso remoto', true)
on conflict (tipo, midia, validade_anos) do nothing;
