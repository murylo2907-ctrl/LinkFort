-- Seed: cupons de exemplo — CARD 05

insert into public.cupons (codigo, tipo, valor, ativo, validade)
values
  ('SINDIMED15', 'percentual', 15.00, true, '2027-12-31 23:59:59+00')
on conflict (codigo) do nothing;
