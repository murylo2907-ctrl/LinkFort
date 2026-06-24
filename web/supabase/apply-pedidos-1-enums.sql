-- CARD 06 — Parte 1 de 4: extensão + enums
-- Cole no SQL Editor e clique Run. Depois rode a parte 2.

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
