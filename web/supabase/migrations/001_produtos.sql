-- Catálogo de certificados digitais — Sintra Motos
-- Migration: 001_produtos.sql

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
