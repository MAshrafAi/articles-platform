-- Phase 3 — Prompts table for admin-editable Edge Function prompts.
-- Edge Functions read editable_content at runtime (service role bypasses RLS)
-- and concatenate the structural footer (lives in code) before sending to OpenAI.
-- UI: /settings/prompts — admin-only. INSERT/DELETE forbidden (seed-managed only).

drop table if exists public.prompts cascade;
drop function if exists public.tg_prompts_updated_at();

create table public.prompts (
  key              text primary key,
  editable_content text not null,
  default_content  text not null,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references public.users(id) on delete set null
);

create or replace function public.tg_prompts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger prompts_set_updated_at
  before update on public.prompts
  for each row execute function public.tg_prompts_updated_at();

alter table public.prompts enable row level security;

create policy "prompts_select_admin" on public.prompts
  for select
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "prompts_update_admin" on public.prompts
  for update
  using (public.get_user_role(auth.uid()) = 'admin')
  with check (public.get_user_role(auth.uid()) = 'admin');
