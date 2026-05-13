-- =============================================================================
-- Automatic driver row on signup (alternative/complement to RPC-only flow)
-- =============================================================================
-- 1. Shared logic: provision_driver_and_membership(user_id, tenant_id)
-- 2. Optional server-side default tenant: public.driver_signup_config (single row id=1)
-- 3. Trigger AFTER INSERT ON auth.users reads tenant from:
--      raw_user_meta_data->>'tenant_id' (set by app signUp options.data)
--      OR driver_signup_config.tenant_id
-- 4. register_self_as_driver RPC delegates to the same function (for hydrate fallback)
--
-- After migration, optionally run:
--   insert into public.driver_signup_config (id, tenant_id)
--   values (1, '<your-tenant-uuid>')
--   on conflict (id) do update set tenant_id = excluded.tenant_id;

create or replace function public.provision_driver_and_membership(p_user_id uuid, p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  disp text;
begin
  if p_user_id is null or p_tenant_id is null then
    return;
  end if;

  if not exists (select 1 from public.tenants t where t.id = p_tenant_id) then
    raise exception 'invalid tenant';
  end if;

  select split_part(coalesce(u.email, ''), '@', 1)
  into disp
  from auth.users u
  where u.id = p_user_id;

  if not exists (
    select 1 from public.drivers d where d.user_id = p_user_id and d.tenant_id = p_tenant_id
  ) then
    insert into public.drivers (tenant_id, user_id, full_name, license_number, status, created_at, updated_at)
    values (
      p_tenant_id,
      p_user_id,
      coalesce(nullif(trim(disp), ''), 'Driver'),
      null,
      'active',
      now(),
      now()
    );
  end if;

  insert into public.memberships (id, tenant_id, user_id, role, created_at)
  values (gen_random_uuid(), p_tenant_id, p_user_id, 'dispatcher'::public.membership_role, now())
  on conflict (tenant_id, user_id) do nothing;
end;
$$;

revoke all on function public.provision_driver_and_membership(uuid, uuid) from public;

create or replace function public.register_self_as_driver(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  perform public.provision_driver_and_membership(auth.uid(), p_tenant_id);
end;
$$;

revoke all on function public.register_self_as_driver(uuid) from public;
grant execute on function public.register_self_as_driver(uuid) to authenticated;

-- Optional DB default when app does not send tenant_id in user metadata
create table if not exists public.driver_signup_config (
  id smallint primary key default 1 check (id = 1),
  tenant_id uuid references public.tenants(id) on delete cascade
);

comment on table public.driver_signup_config is
  'Single row (id=1): default tenant for auth trigger when raw_user_meta_data.tenant_id is missing.';

create or replace function public.handle_auth_user_created_driver()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  meta text := NEW.raw_user_meta_data->>'tenant_id';
begin
  begin
    if meta is not null and trim(meta) <> '' then
      tid := meta::uuid;
    end if;
  exception
    when invalid_text_representation then
      tid := null;
  end;

  if tid is null then
    select c.tenant_id into tid from public.driver_signup_config c where c.id = 1;
  end if;

  if tid is null then
    return NEW;
  end if;

  begin
    perform public.provision_driver_and_membership(NEW.id, tid);
  exception
    when others then
      -- Log via raise notice in dev; avoid failing user signup if misconfigured
      raise warning 'provision_driver_and_membership failed for user %: %', NEW.id, sqlerrm;
  end;

  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created_driver on auth.users;

create trigger on_auth_user_created_driver
  after insert on auth.users
  for each row
  execute function public.handle_auth_user_created_driver();

comment on function public.handle_auth_user_created_driver() is
  'After auth signup: creates drivers + dispatcher membership when tenant_id is in user metadata or driver_signup_config.';
