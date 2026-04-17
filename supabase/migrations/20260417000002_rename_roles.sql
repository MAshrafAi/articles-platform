-- =============================================================================
-- Rename roles: old 'admin' → 'employee', old 'superadmin' → 'admin'.
-- UI label rename only — permissions and logic are preserved exactly.
-- =============================================================================

-- Drop policies that reference the old role names as string literals (policies
-- are stored as parsed expressions and cast to the enum at plan time; renaming
-- an enum value invalidates them, so we drop and recreate to be safe).
drop policy if exists "users_read_self"      on public.users;
drop policy if exists "superadmin_read_all"  on public.users;
drop policy if exists "superadmin_insert"    on public.users;
drop policy if exists "superadmin_update"    on public.users;
drop policy if exists "users_update_self_name" on public.users;
drop policy if exists "superadmin_delete"    on public.users;

drop policy if exists "articles_select_author_or_superadmin" on public.articles;
drop policy if exists "articles_insert_self"                 on public.articles;
drop policy if exists "articles_update_author_or_superadmin" on public.articles;
drop policy if exists "articles_delete_author_or_superadmin" on public.articles;

-- Drop trigger + function that reference the old role names
drop trigger if exists trg_prevent_last_superadmin on public.users;
drop function if exists public.prevent_last_superadmin_removal();

-- -----------------------------------------------------------------------------
-- Rename enum values
-- -----------------------------------------------------------------------------
alter type public.user_role rename value 'admin' to 'employee';
alter type public.user_role rename value 'superadmin' to 'admin';

-- The column default was 'admin' (the base role). After renaming, the literal
-- 'admin' now refers to the elevated role. Explicitly pin the default to the
-- base role under its new name so new users continue to default to 'employee'.
alter table public.users alter column role set default 'employee';

-- -----------------------------------------------------------------------------
-- Recreate trigger: prevent deletion or demotion of the last admin
-- (same logic, new name + updated Arabic error message)
-- -----------------------------------------------------------------------------
create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
as $$
declare
  admin_count int;
begin
  if old.role = 'admin' then
    if tg_op = 'DELETE'
       or (tg_op = 'UPDATE' and new.role is distinct from 'admin')
    then
      select count(*) into admin_count from public.users where role = 'admin';
      if admin_count <= 1 then
        raise exception 'لا يمكن حذف أو تخفيض آخر أدمن في المنصة';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_last_admin
  before update or delete on public.users
  for each row
  execute function public.prevent_last_admin_removal();

-- -----------------------------------------------------------------------------
-- Recreate users policies (logic unchanged, references to old role names
-- updated: 'superadmin' → 'admin')
-- -----------------------------------------------------------------------------
create policy "users_read_self"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "admin_read_all"
  on public.users
  for select
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "admin_insert"
  on public.users
  for insert
  to authenticated
  with check (public.get_user_role(auth.uid()) = 'admin');

create policy "admin_update"
  on public.users
  for update
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin')
  with check (public.get_user_role(auth.uid()) = 'admin');

create policy "users_update_self_name"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.users where id = auth.uid()));

create policy "admin_delete"
  on public.users
  for delete
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin');

-- -----------------------------------------------------------------------------
-- Recreate articles policies (logic unchanged, role names updated)
-- -----------------------------------------------------------------------------
create policy "articles_select_author_or_admin"
  on public.articles
  for select
  to authenticated
  using (
    author_id = auth.uid()
    or public.get_user_role(auth.uid()) = 'admin'
  );

create policy "articles_insert_self"
  on public.articles
  for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "articles_update_author_or_admin"
  on public.articles
  for update
  to authenticated
  using (
    author_id = auth.uid()
    or public.get_user_role(auth.uid()) = 'admin'
  )
  with check (
    author_id = auth.uid()
    or public.get_user_role(auth.uid()) = 'admin'
  );

create policy "articles_delete_author_or_admin"
  on public.articles
  for delete
  to authenticated
  using (
    author_id = auth.uid()
    or public.get_user_role(auth.uid()) = 'admin'
  );
