-- Execute APÓS rodar 001_partner_portal.sql
-- 1. Crie o usuário em Authentication → Users → Add user
-- 2. Copie o UUID do usuário e substitua abaixo

-- Tornar usuário admin
insert into public.partner_roles (user_id, role)
values ('COLE_UUID_DO_ADMIN_AQUI', 'admin')
on conflict (user_id) do update set role = 'admin';

-- ---------------------------------------------------------------------------
-- Parceiro de teste (opcional)
-- 1. Crie outro usuário em Authentication → Users
-- 2. Substitua os UUIDs e dados abaixo
-- ---------------------------------------------------------------------------

/*
insert into public.partners (id, full_name, email, phone, partner_code, partner_type, status)
values (
  'COLE_UUID_DO_PARCEIRO_AQUI',
  'Maria Teste',
  'maria@email.com',
  '41999999999',
  public.generate_partner_code('Maria Teste'),
  'indicacao',
  'active'
);

insert into public.partner_roles (user_id, role)
values ('COLE_UUID_DO_PARCEIRO_AQUI', 'partner')
on conflict (user_id) do update set role = 'partner';

insert into public.referrals (partner_id, customer_name, product_name, sale_amount, commission_amount, status, sale_date, notes)
values (
  'COLE_UUID_DO_PARCEIRO_AQUI',
  'João Silva',
  'e-CPF A1',
  189.90,
  30.00,
  'pendente',
  current_date,
  'Venda de teste'
);
*/
