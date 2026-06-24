-- CARD 06 — Parte 4c: policy INSERT em pedidos
create policy pedidos_insert_anon
  on public.pedidos
  for insert
  to anon, authenticated
  with check (true);
