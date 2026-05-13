-- Live driver position for one trip (upserted while "share live location" is on).
-- Viewers subscribe via Supabase Realtime postgres_changes on this table.

create table if not exists public.driver_live_positions (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  updated_at timestamptz not null default now()
);

comment on table public.driver_live_positions is
  'Latest coordinates per active trip for realtime map viewers; driver upserts while sharing is on.';

create index if not exists driver_live_positions_tenant_idx
  on public.driver_live_positions (tenant_id);

alter table public.driver_live_positions enable row level security;

alter publication supabase_realtime add table public.driver_live_positions;

create policy driver_live_positions_select_member
  on public.driver_live_positions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = driver_live_positions.tenant_id
    )
  );

create policy driver_live_positions_insert_self
  on public.driver_live_positions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.trips t
      where t.id = trip_id
        and t.tenant_id = tenant_id
    )
  );

create policy driver_live_positions_update_self
  on public.driver_live_positions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy driver_live_positions_delete_self
  on public.driver_live_positions
  for delete
  to authenticated
  using (auth.uid() = user_id);
