-- =============================================================================
-- Users table + role system (first migration)
-- =============================================================================

-- Role enum
create type public.user_role as enum ('admin', 'superadmin');

-- Profile table mirroring auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role public.user_role not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_role_idx on public.users (role);

-- -----------------------------------------------------------------------------
-- Trigger: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Trigger: prevent deletion or demotion of the last superadmin
-- -----------------------------------------------------------------------------
create or replace function public.prevent_last_superadmin_removal()
returns trigger
language plpgsql
as $$
declare
  superadmin_count int;
begin
  if old.role = 'superadmin' then
    if tg_op = 'DELETE'
       or (tg_op = 'UPDATE' and new.role is distinct from 'superadmin')
    then
      select count(*) into superadmin_count from public.users where role = 'superadmin';
      if superadmin_count <= 1 then
        raise exception 'لا يمكن حذف أو تخفيض آخر سوبر أدمن في المنصة';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_last_superadmin
  before update or delete on public.users
  for each row
  execute function public.prevent_last_superadmin_removal();

-- -----------------------------------------------------------------------------
-- Helper: get role for a user id (SECURITY DEFINER to bypass RLS safely)
-- -----------------------------------------------------------------------------
create or replace function public.get_user_role(uid uuid)
returns public.user_role
language sql
security definer
set search_path = public
as $$
  select role from public.users where id = uid;
$$;

-- Allow authenticated users to invoke it for themselves (middleware uses it)
grant execute on function public.get_user_role(uuid) to authenticated, anon;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;

-- Any authenticated user can read their own row
create policy "users_read_self"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

-- Superadmins can select everything
create policy "superadmin_read_all"
  on public.users
  for select
  to authenticated
  using (public.get_user_role(auth.uid()) = 'superadmin');

-- Superadmins can insert (for invite flow fallback)
create policy "superadmin_insert"
  on public.users
  for insert
  to authenticated
  with check (public.get_user_role(auth.uid()) = 'superadmin');

-- Superadmins can update roles/metadata
create policy "superadmin_update"
  on public.users
  for update
  to authenticated
  using (public.get_user_role(auth.uid()) = 'superadmin')
  with check (public.get_user_role(auth.uid()) = 'superadmin');

-- Users can update their own full_name (but not role)
create policy "users_update_self_name"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.users where id = auth.uid()));

-- Superadmins can delete
create policy "superadmin_delete"
  on public.users
  for delete
  to authenticated
  using (public.get_user_role(auth.uid()) = 'superadmin');
