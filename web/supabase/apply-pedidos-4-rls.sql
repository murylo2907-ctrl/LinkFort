-- CARD 06 — Parte 4 de 4: RLS + policies de INSERT
-- Rode só depois da parte 3.

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
