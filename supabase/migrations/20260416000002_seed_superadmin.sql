-- =============================================================================
-- Seed the first superadmin.
-- Requires: the user shawkytorky98@gmail.com must already exist in auth.users.
-- Create the account manually in Supabase Studio → Authentication → Users
-- (Add user → tick "Auto Confirm User") BEFORE running this migration.
-- =============================================================================

do $$
declare
  target_email text := 'shawkytorky98@gmail.com';
  target_id uuid;
begin
  select id into target_id from auth.users where email = target_email;

  if target_id is null then
    raise notice
      'Skipping superadmin seed — auth user % not found. Create it first, then re-run this migration.',
      target_email;
    return;
  end if;

  insert into public.users (id, email, full_name, role)
  values (target_id, target_email, 'Shawky Torky', 'superadmin')
  on conflict (id) do update
    set role = 'superadmin',
        email = excluded.email;
end;
$$;
