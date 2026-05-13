-- Self-serve driver signup: creates drivers + memberships rows for auth.uid().
-- 1) Apply this migration in Supabase (SQL editor or `supabase db push`).
-- 2) Set EXPO_PUBLIC_SIGNUP_TENANT_ID in the app to your tenant UUID (same as in public.tenants).
-- SECURITY DEFINER bypasses RLS; only inserts for auth.uid() into the given tenant.

create or replace function public.register_self_as_driver(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  disp text;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if not exists (select 1 from public.tenants t where t.id = p_tenant_id) then
    raise exception 'invalid tenant';
  end if;

  select split_part(coalesce(u.email, ''), '@', 1) into disp from auth.users u where u.id = uid;

  if not exists (
    select 1 from public.drivers d where d.user_id = uid and d.tenant_id = p_tenant_id
  ) then
    insert into public.drivers (tenant_id, user_id, full_name, license_number, status, created_at, updated_at)
    values (
      p_tenant_id,
      uid,
      coalesce(nullif(trim(disp), ''), 'Driver'),
      null,
      'active',
      now(),
      now()
    );
  end if;

  insert into public.memberships (id, tenant_id, user_id, role, created_at)
  values (gen_random_uuid(), p_tenant_id, uid, 'dispatcher'::public.membership_role, now())
  on conflict (tenant_id, user_id) do nothing;
end;
$$;

revoke all on function public.register_self_as_driver(uuid) from public;
grant execute on function public.register_self_as_driver(uuid) to authenticated;

comment on function public.register_self_as_driver(uuid) is
  'Driver app: creates drivers row + dispatcher membership for auth.uid() in p_tenant_id. Called after signup when EXPO_PUBLIC_SIGNUP_TENANT_ID is set.';
