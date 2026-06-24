-- Pedidos de checkout — CARD 06
-- Migration: 003_pedidos.sql

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'forma_pagamento') then
    create type public.forma_pagamento as enum ('pix', 'cartao', 'boleto');
  end if;

  if not exists (select 1 from pg_type where typname = 'pedido_status') then
    create type public.pedido_status as enum ('pendente', 'pago', 'cancelado', 'expirado');
  end if;
end
$$;

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  status public.pedido_status not null default 'pendente',
  cliente_nome text not null,
  cliente_cpf_cnpj text not null,
  cliente_email text not null,
  cliente_whatsapp text not null,
  forma_pagamento public.forma_pagamento not null,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  desconto_cupom numeric(10, 2) not null default 0 check (desconto_cupom >= 0),
  desconto_pix numeric(10, 2) not null default 0 check (desconto_pix >= 0),
  total numeric(10, 2) not null check (total >= 0),
  cupom_codigo text,
  created_at timestamptz not null default now(),
  constraint pedidos_cliente_cpf_cnpj_digits check (
    cliente_cpf_cnpj ~ '^\d{11}$' or cliente_cpf_cnpj ~ '^\d{14}$'
  )
);

create index if not exists pedidos_status_idx on public.pedidos (status);
create index if not exists pedidos_created_at_idx on public.pedidos (created_at desc);

create table if not exists public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  produto_id uuid not null references public.produtos (id),
  quantidade int not null check (quantidade > 0 and quantidade <= 99),
  preco_unitario numeric(10, 2) not null check (preco_unitario >= 0),
  nome_snapshot text not null
);

create index if not exists pedido_itens_pedido_id_idx on public.pedido_itens (pedido_id);

alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

drop policy if exists pedidos_insert_anon on public.pedidos;
drop policy if exists pedido_itens_insert_anon on public.pedido_itens;

create policy pedidos_insert_anon
  on public.pedidos
  for insert
  to anon, authenticated
  with check (true);

create policy pedido_itens_insert_anon
  on public.pedido_itens
  for insert
  to anon, authenticated
  with check (true);
