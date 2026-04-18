-- Products table (mirrors articles pattern)
create table public.products (
  id text primary key default public.gen_nanoid(12),
  author_id uuid not null references public.users(id) on delete cascade,
  title text,
  product_url text,
  keyword text,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  status public.article_status not null default 'ready',
  pipeline_logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_author_id_idx on public.products(author_id);
create index products_created_at_idx on public.products(created_at desc);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.products enable row level security;

create policy "products_select" on public.products for select to authenticated
  using (author_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin');

create policy "products_insert" on public.products for insert to authenticated
  with check (author_id = auth.uid());

create policy "products_update" on public.products for update to authenticated
  using (author_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin')
  with check (author_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin');

create policy "products_delete" on public.products for delete to authenticated
  using (author_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin');
