-- Convites de parceiro: admin cadastra sem UUID; parceiro ativa conta pelo link

create table public.partner_invites (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  email text not null,
  full_name text not null,
  phone text,
  company text,
  partner_type public.partner_type not null default 'indicacao',
  partner_code text not null unique,
  created_by uuid references auth.users (id) on delete set null,
  claimed_at timestamptz,
  claimed_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  constraint partner_invites_email_lower check (email = lower(email))
);

create index partner_invites_token_idx on public.partner_invites (token);
create index partner_invites_email_idx on public.partner_invites (email);
create unique index partner_invites_open_email_idx
  on public.partner_invites (email)
  where claimed_at is null;

alter table public.partner_invites enable row level security;

create policy "Admin gerencia convites"
  on public.partner_invites
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admin cria convite (sem precisar do UUID do Auth)
create or replace function public.admin_create_partner_invite(
  p_full_name text,
  p_email text,
  p_phone text default null,
  p_company text default null,
  p_partner_type public.partner_type default 'indicacao'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_code text;
  v_token uuid;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'E-mail inválido';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Já existe um usuário com este e-mail. Use o painel do Supabase para vincular manualmente.';
  end if;

  if exists (select 1 from public.partners where lower(email) = v_email) then
    raise exception 'Este e-mail já está cadastrado como parceiro';
  end if;

  if exists (
    select 1 from public.partner_invites
    where lower(email) = v_email and claimed_at is null and expires_at > now()
  ) then
    raise exception 'Já existe um convite pendente para este e-mail';
  end if;

  v_code := public.generate_partner_code(p_full_name);

  insert into public.partner_invites (
    email, full_name, phone, company, partner_type, partner_code, created_by
  )
  values (
    v_email,
    trim(p_full_name),
    nullif(trim(p_phone), ''),
    nullif(trim(p_company), ''),
    p_partner_type,
    v_code,
    auth.uid()
  )
  returning token into v_token;

  return json_build_object(
    'token', v_token,
    'partner_code', v_code,
    'email', v_email
  );
end;
$$;

-- Dados do convite para a página de ativação (público, só com token válido)
create or replace function public.get_partner_invite(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.partner_invites%rowtype;
begin
  select * into v_invite
  from public.partner_invites
  where token = p_token;

  if not found then
    raise exception 'Convite não encontrado';
  end if;

  if v_invite.claimed_at is not null then
    raise exception 'Este convite já foi utilizado';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'Este convite expirou. Peça um novo à Link Forte.';
  end if;

  return json_build_object(
    'email', v_invite.email,
    'full_name', v_invite.full_name,
    'partner_code', v_invite.partner_code,
    'partner_type', v_invite.partner_type
  );
end;
$$;

-- Após signUp, vincula auth.users ao perfil de parceiro
create or replace function public.claim_partner_invite(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.partner_invites%rowtype;
  v_user_email text;
begin
  if auth.uid() is null then
    raise exception 'Faça login ou crie sua conta antes de ativar o convite';
  end if;

  select lower(email) into v_user_email
  from auth.users
  where id = auth.uid();

  select * into v_invite
  from public.partner_invites
  where token = p_token
  for update;

  if not found then
    raise exception 'Convite não encontrado';
  end if;

  if v_invite.claimed_at is not null then
    raise exception 'Este convite já foi utilizado';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'Este convite expirou';
  end if;

  if v_user_email <> lower(v_invite.email) then
    raise exception 'O e-mail da conta não confere com o convite';
  end if;

  insert into public.partners (
    id, full_name, email, phone, company, partner_code, partner_type, status
  )
  values (
    auth.uid(),
    v_invite.full_name,
    v_invite.email,
    v_invite.phone,
    v_invite.company,
    v_invite.partner_code,
    v_invite.partner_type,
    'active'
  );

  insert into public.partner_roles (user_id, role)
  values (auth.uid(), 'partner')
  on conflict (user_id) do update set role = 'partner';

  update public.partner_invites
  set claimed_at = now(), claimed_by = auth.uid()
  where id = v_invite.id;

  return json_build_object('partner_code', v_invite.partner_code);
end;
$$;

grant execute on function public.admin_create_partner_invite(text, text, text, text, public.partner_type) to authenticated;
grant execute on function public.get_partner_invite(uuid) to anon, authenticated;
grant execute on function public.claim_partner_invite(uuid) to authenticated;
