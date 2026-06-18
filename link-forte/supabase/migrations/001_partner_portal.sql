-- Portal de Parceiros Link Forte
-- Migration: 001_partner_portal.sql

-- ---------------------------------------------------------------------------
-- Extensões
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------
create type public.partner_type as enum ('indicacao', 'revenda', 'ar');
create type public.partner_status as enum ('active', 'inactive');
create type public.referral_status as enum ('pendente', 'aprovada', 'paga');
create type public.material_type as enum ('banner', 'pdf', 'texto', 'video');
create type public.app_role as enum ('admin', 'partner');

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

-- Perfil do parceiro (1:1 com auth.users)
create table public.partners (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  company text,
  partner_code text not null unique,
  partner_type public.partner_type not null default 'indicacao',
  status public.partner_status not null default 'active',
  created_at timestamptz not null default now()
);

create index partners_partner_code_idx on public.partners (partner_code);
create index partners_status_idx on public.partners (status);

-- Indicações / vendas registradas pelo admin
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  customer_name text not null,
  product_name text not null,
  sale_amount numeric(12, 2) not null check (sale_amount >= 0),
  commission_amount numeric(12, 2) not null check (commission_amount >= 0),
  status public.referral_status not null default 'pendente',
  sale_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index referrals_partner_id_idx on public.referrals (partner_id);
create index referrals_status_idx on public.referrals (status);
create index referrals_sale_date_idx on public.referrals (sale_date desc);

-- Materiais de divulgação
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text,
  download_path text,
  type public.material_type not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint materials_has_source check (
    type = 'texto' or file_url is not null or download_path is not null
  )
);

create index materials_is_active_sort_idx on public.materials (is_active, sort_order);

-- Controle de papéis (admin vs parceiro)
create table public.partner_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'partner',
  created_at timestamptz not null default now()
);

create index partner_roles_role_idx on public.partner_roles (role);

-- ---------------------------------------------------------------------------
-- Funções auxiliares para RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.partner_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_partner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.partner_roles
    where user_id = auth.uid()
      and role = 'partner'
  );
$$;

-- Gera código único para link de indicação (ex: LF-MARIA-7K2)
create or replace function public.generate_partner_code(p_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_suffix text;
  v_code text;
begin
  v_slug := upper(
    regexp_replace(
      left(trim(p_name), 12),
      '[^a-zA-Z0-9]',
      '',
      'g'
    )
  );
  if v_slug = '' then
    v_slug := 'PARCEIRO';
  end if;
  loop
    v_suffix := upper(substr(md5(random()::text), 1, 3));
    v_code := 'LF-' || v_slug || '-' || v_suffix;
    exit when not exists (select 1 from public.partners where partner_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.partners enable row level security;
alter table public.referrals enable row level security;
alter table public.materials enable row level security;
alter table public.partner_roles enable row level security;

-- partners
create policy "Parceiro lê o próprio perfil"
  on public.partners
  for select
  to authenticated
  using (id = auth.uid());

create policy "Admin lê todos os parceiros"
  on public.partners
  for select
  to authenticated
  using (public.is_admin());

create policy "Admin insere parceiros"
  on public.partners
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admin atualiza parceiros"
  on public.partners
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin remove parceiros"
  on public.partners
  for delete
  to authenticated
  using (public.is_admin());

-- referrals
create policy "Parceiro lê as próprias indicações"
  on public.referrals
  for select
  to authenticated
  using (partner_id = auth.uid());

create policy "Admin lê todas as indicações"
  on public.referrals
  for select
  to authenticated
  using (public.is_admin());

create policy "Admin insere indicações"
  on public.referrals
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admin atualiza indicações"
  on public.referrals
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin remove indicações"
  on public.referrals
  for delete
  to authenticated
  using (public.is_admin());

-- materials
create policy "Parceiro lê materiais ativos"
  on public.materials
  for select
  to authenticated
  using (is_active = true);

create policy "Admin lê todos os materiais"
  on public.materials
  for select
  to authenticated
  using (public.is_admin());

create policy "Admin insere materiais"
  on public.materials
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admin atualiza materiais"
  on public.materials
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin remove materiais"
  on public.materials
  for delete
  to authenticated
  using (public.is_admin());

-- partner_roles (somente admin gerencia; usuário lê o próprio papel)
create policy "Usuário lê o próprio papel"
  on public.partner_roles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admin lê todos os papéis"
  on public.partner_roles
  for select
  to authenticated
  using (public.is_admin());

create policy "Admin insere papéis"
  on public.partner_roles
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admin atualiza papéis"
  on public.partner_roles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin remove papéis"
  on public.partner_roles
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Dados iniciais opcionais (materiais de exemplo)
-- ---------------------------------------------------------------------------
insert into public.materials (title, description, file_url, type, is_active, sort_order)
values
  (
    'Banner principal',
    'Banner para redes sociais e site.',
    'assets/images/LINKFORTE-vetor.png',
    'banner',
    true,
    1
  ),
  (
    'Texto para WhatsApp',
    'Olá! Indico a Link Forte para emissão de certificado digital. Atendimento rápido e seguro. Acesse: https://linkforte.com.br',
    null,
    'texto',
    true,
    2
  ),
  (
    'Apresentação PDF',
    'Apresentação institucional da Link Forte para parceiros.',
    'https://linkforte.com.br/wp-content/uploads/apresentacao-link-forte.pdf',
    'pdf',
    true,
    3
  );
