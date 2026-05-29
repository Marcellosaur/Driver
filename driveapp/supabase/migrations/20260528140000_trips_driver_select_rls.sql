-- Driver app boot check: SELECT active/scheduled trips for tenant members and assigned drivers.
-- Apply in Supabase SQL editor if boot check fails with permission denied / RLS errors.

alter table public.trips enable row level security;

drop policy if exists trips_select_driver_app on public.trips;
create policy trips_select_driver_app
  on public.trips
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = trips.tenant_id
    )
    or exists (
      select 1
      from public.drivers d
      where d.user_id = auth.uid()
        and d.id = trips.driver_id
        and d.tenant_id = trips.tenant_id
    )
  );

drop policy if exists trips_update_driver_app on public.trips;
create policy trips_update_driver_app
  on public.trips
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = trips.tenant_id
        and m.role in ('dispatcher', 'company_admin')
    )
    or exists (
      select 1
      from public.drivers d
      where d.user_id = auth.uid()
        and d.id = trips.driver_id
        and d.tenant_id = trips.tenant_id
    )
  )
  with check (
    exists (
      select 1
      from public.memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = trips.tenant_id
        and m.role in ('dispatcher', 'company_admin')
    )
    or exists (
      select 1
      from public.drivers d
      where d.user_id = auth.uid()
        and d.id = trips.driver_id
        and d.tenant_id = trips.tenant_id
    )
  );
