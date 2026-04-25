-- Prompts table: stores the editable portion of each AI prompt used by
-- the 3 generator edge functions. The structural footer (JSON schema,
-- hard counts, output format) stays in supabase/functions/prompts/*.ts
-- as the single source of truth and is concatenated at runtime.
--
-- Rows are NOT seeded here. Admin edits are upserted by the
-- updatePromptAction server action; until a row exists, edge functions
-- fall back to *_EDITABLE_DEFAULT imported from the prompt TS files,
-- and the admin UI displays the same defaults.

create table public.prompts (
  key text primary key,
  editable_content text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id) on delete set null
);

create trigger trg_prompts_updated_at
  before update on public.prompts
  for each row execute function public.handle_updated_at();

alter table public.prompts enable row level security;

-- Admins read all prompts; employees have no policy and therefore see nothing.
-- Edge functions use the service role and bypass RLS entirely.
create policy "prompts_admin_read"
  on public.prompts for select
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin');

-- Admins upsert (insert on first save, update thereafter).
create policy "prompts_admin_insert"
  on public.prompts for insert
  to authenticated
  with check (public.get_user_role(auth.uid()) = 'admin');

create policy "prompts_admin_update"
  on public.prompts for update
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin')
  with check (public.get_user_role(auth.uid()) = 'admin');
