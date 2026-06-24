-- Mercado Pago — idempotência e rastreamento de pagamentos
-- Migration: 004_pedidos_mp.sql

alter table public.pedidos
  add column if not exists mp_payment_id text,
  add column if not exists mp_status text;

create index if not exists pedidos_mp_payment_id_idx on public.pedidos (mp_payment_id)
  where mp_payment_id is not null;
