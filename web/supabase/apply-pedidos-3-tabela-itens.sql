-- CARD 06 — Parte 3 de 4: tabela pedido_itens + índice
-- Rode só depois da parte 2.

create table if not exists public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  produto_id uuid not null references public.produtos (id),
  quantidade int not null check (quantidade > 0 and quantidade <= 99),
  preco_unitario numeric(10, 2) not null check (preco_unitario >= 0),
  nome_snapshot text not null
);

create index if not exists pedido_itens_pedido_id_idx on public.pedido_itens (pedido_id);
