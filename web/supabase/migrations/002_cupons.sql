-- Cupons de convênio / associações — CARD 05
-- Migration: 002_cupons.sql

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'cupom_tipo') then
    create type public.cupom_tipo as enum ('percentual', 'fixo');
  end if;
end
$$;

create table if not exists public.cupons (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  tipo public.cupom_tipo not null,
  valor numeric(10, 2) not null check (valor >= 0),
  ativo boolean not null default true,
  validade timestamptz,
  created_at timestamptz not null default now(),
  constraint cupons_codigo_unique unique (codigo),
  constraint cupons_codigo_upper check (codigo = upper(codigo)),
  constraint cupons_percentual_range check (
    tipo <> 'percentual' or (valor >= 0 and valor <= 100)
  )
);

create index if not exists cupons_codigo_ativo_idx
  on public.cupons (codigo)
  where ativo = true;

alter table public.cupons enable row level security;

-- Sem policy de SELECT pública — validação apenas via RPC security definer

create or replace function public.validar_cupom(
  p_codigo text,
  p_total numeric
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo text := upper(trim(p_codigo));
  v_cupom public.cupons%rowtype;
  v_desconto numeric(10, 2);
begin
  if p_total is null or p_total <= 0 then
    return json_build_object(
      'valido', false,
      'erro', 'Total inválido para aplicar cupom.'
    );
  end if;

  if v_codigo = '' then
    return json_build_object(
      'valido', false,
      'erro', 'Informe um código de cupom.'
    );
  end if;

  select *
  into v_cupom
  from public.cupons
  where codigo = v_codigo
    and ativo = true
    and (validade is null or validade >= now())
  limit 1;

  if not found then
    return json_build_object(
      'valido', false,
      'erro', 'Cupom inválido ou expirado.'
    );
  end if;

  if v_cupom.tipo = 'percentual' then
    v_desconto := round(p_total * v_cupom.valor / 100, 2);
  else
    v_desconto := least(v_cupom.valor, p_total);
  end if;

  v_desconto := least(v_desconto, p_total);

  return json_build_object(
    'valido', true,
    'codigo', v_cupom.codigo,
    'tipo', v_cupom.tipo::text,
    'desconto', v_desconto,
    'total_final', round(p_total - v_desconto, 2)
  );
end;
$$;

grant execute on function public.validar_cupom(text, numeric) to anon, authenticated;
