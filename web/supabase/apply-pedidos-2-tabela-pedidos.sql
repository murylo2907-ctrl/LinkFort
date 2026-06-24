-- CARD 06 — Parte 2 de 4: tabela pedidos + índices
-- Rode só depois da parte 1.

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
