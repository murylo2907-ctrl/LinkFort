-- Execute só o seed (tabela produtos já existe)
-- Cole no SQL Editor do Supabase e clique em Run

insert into public.produtos (nome, tipo, midia, validade_anos, preco, descricao, ativo)
values
  ('e-CPF A1 — 1 ano', 'e-CPF', 'A1', 1, 165.00, 'Arquivo digital com backup', true),
  ('e-CPF A1 — 2 anos', 'e-CPF', 'A1', 2, 222.75, 'Arquivo digital com backup', true),
  ('e-CPF A1 — 3 anos', 'e-CPF', 'A1', 3, 280.50, 'Arquivo digital com backup', true),
  ('e-CNPJ A1 — 1 ano', 'e-CNPJ', 'A1', 1, 240.00, 'Arquivo digital com backup', true),
  ('e-CPF Nuvem — 1 ano', 'e-CPF', 'Nuvem', 1, 189.90, 'Certificado em nuvem, acesso remoto', true),
  ('e-CPF Nuvem — 2 anos', 'e-CPF', 'Nuvem', 2, 259.90, 'Certificado em nuvem, acesso remoto', true),
  ('e-CNPJ Nuvem — 1 ano', 'e-CNPJ', 'Nuvem', 1, 279.90, 'Certificado em nuvem, acesso remoto', true),
  ('e-CPF A3 — 1 ano', 'e-CPF', 'A3', 1, 280.00, 'Token/cartão — validação presencial', true),
  ('e-CNPJ A3 — 2 anos', 'e-CNPJ', 'A3', 2, 320.00, 'Token/cartão — validação presencial', true),
  ('e-CNPJ Nuvem — 3 anos', 'e-CNPJ', 'Nuvem', 3, 449.90, 'Certificado em nuvem, acesso remoto', true)
on conflict (tipo, midia, validade_anos) do nothing;

-- Verificar:
-- select count(*) from produtos where ativo = true;
