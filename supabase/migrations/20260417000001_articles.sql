-- Phase 2 — Articles table, nanoid IDs, and RLS policies
-- Mirrors the users-pattern RLS: author sees own, superadmin sees all.

-- Enum for article type
create type public.article_type as enum ('product', 'informational');

-- Helper: nanoid-like short ID generator (12 chars from URL-safe alphabet)
create or replace function public.gen_nanoid(size int default 12)
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  result text := '';
  i int := 0;
  bytes bytea := gen_random_bytes(size);
begin
  while i < size loop
    result := result || substr(alphabet, 1 + (get_byte(bytes, i) % 64), 1);
    i := i + 1;
  end loop;
  return result;
end;
$$;

-- Articles table
create table public.articles (
  id text primary key default public.gen_nanoid(12),
  author_id uuid not null references public.users(id) on delete cascade,
  title text,
  type public.article_type not null,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_author_id_idx on public.articles(author_id);
create index articles_created_at_idx on public.articles(created_at desc);
create index articles_type_idx on public.articles(type);

-- Reuse updated_at trigger function from users migration
create trigger trg_articles_updated_at
  before update on public.articles
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.articles enable row level security;

-- SELECT: author or superadmin
create policy "articles_select_author_or_superadmin"
  on public.articles
  for select
  to authenticated
  using (
    author_id = auth.uid()
    or public.get_user_role(auth.uid()) = 'superadmin'
  );

-- INSERT: only authenticated users can insert, and only as themselves
create policy "articles_insert_self"
  on public.articles
  for insert
  to authenticated
  with check (author_id = auth.uid());

-- UPDATE: author or superadmin
create policy "articles_update_author_or_superadmin"
  on public.articles
  for update
  to authenticated
  using (
    author_id = auth.uid()
    or public.get_user_role(auth.uid()) = 'superadmin'
  )
  with check (
    author_id = auth.uid()
    or public.get_user_role(auth.uid()) = 'superadmin'
  );

-- DELETE: author or superadmin
create policy "articles_delete_author_or_superadmin"
  on public.articles
  for delete
  to authenticated
  using (
    author_id = auth.uid()
    or public.get_user_role(auth.uid()) = 'superadmin'
  );
