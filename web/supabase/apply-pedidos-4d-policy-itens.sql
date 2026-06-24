-- CARD 06 — Parte 4d: policy INSERT em pedido_itens
create policy pedido_itens_insert_anon
  on public.pedido_itens
  for insert
  to anon, authenticated
  with check (true);
