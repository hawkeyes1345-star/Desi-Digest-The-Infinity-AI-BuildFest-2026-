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
security invoker
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

revoke execute on function public.match_foods(vector, int) from anon;
grant execute on function public.match_foods(vector, int) to authenticated;