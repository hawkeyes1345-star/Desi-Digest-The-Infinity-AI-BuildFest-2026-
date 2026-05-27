create extension if not exists vector;

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  food_id text not null unique,
  name_en text not null,
  name_bn text not null,
  category text not null,
  typical_portion_grams numeric not null,
  nutrition_per_portion jsonb not null default '{}'::jsonb,
  visual_description text not null,
  common_combinations text,
  health_tags text[] not null default '{}',
  boudi_friendly_note text,
  embedding vector(1536),
  embedding_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists foods_embedding_idx
  on public.foods using hnsw (embedding vector_cosine_ops);

create index if not exists foods_category_idx on public.foods (category);
create index if not exists foods_food_id_idx on public.foods (food_id);

alter table public.foods enable row level security;

drop policy if exists "foods readable by authenticated" on public.foods;
create policy "foods readable by authenticated"
  on public.foods
  for select
  to authenticated
  using (true);

create trigger foods_set_updated_at
before update on public.foods
for each row execute function public.update_updated_at_column();

create or replace function public.match_foods(
  query_embedding vector(1536),
  match_count int default 8
)
returns table (
  food_id text,
  name_en text,
  name_bn text,
  category text,
  typical_portion_grams numeric,
  nutrition_per_portion jsonb,
  visual_description text,
  common_combinations text,
  health_tags text[],
  boudi_friendly_note text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.food_id,
    f.name_en,
    f.name_bn,
    f.category,
    f.typical_portion_grams,
    f.nutrition_per_portion,
    f.visual_description,
    f.common_combinations,
    f.health_tags,
    f.boudi_friendly_note,
    1 - (f.embedding <=> query_embedding) as similarity
  from public.foods f
  where f.embedding is not null
  order by f.embedding <=> query_embedding
  limit match_count;
$$;