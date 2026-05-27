create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  user_id uuid primary key,
  display_name text,
  age int,
  sex text check (sex in ('female','male','other') or sex is null),
  height_cm numeric,
  weight_kg numeric,
  activity_level text check (activity_level in ('sedentary','moderate','active','athlete') or activity_level is null),
  budget_bdt int,
  budget_period text check (budget_period in ('weekly','monthly') or budget_period is null) default 'weekly',
  goals text[] not null default '{}',
  location text,
  alternative_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = user_id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update using (auth.uid() = user_id);
create policy "own profile delete" on public.profiles for delete using (auth.uid() = user_id);
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.update_updated_at_column();

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  logged_at timestamptz not null default now(),
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  name text not null,
  notes text,
  calories numeric not null default 0,
  protein_g numeric not null default 0,
  fat_g numeric not null default 0,
  carbs_g numeric not null default 0,
  sugar_g numeric not null default 0,
  sodium_mg numeric not null default 0,
  fiber_g numeric not null default 0,
  water_ml numeric not null default 0,
  health_score numeric,
  source text not null default 'manual' check (source in ('manual','photo','recommendation')),
  created_at timestamptz not null default now()
);
alter table public.meal_logs enable row level security;
create policy "own logs select" on public.meal_logs for select using (auth.uid() = user_id);
create policy "own logs insert" on public.meal_logs for insert with check (auth.uid() = user_id);
create policy "own logs update" on public.meal_logs for update using (auth.uid() = user_id);
create policy "own logs delete" on public.meal_logs for delete using (auth.uid() = user_id);
create index meal_logs_user_logged_at_idx on public.meal_logs (user_id, logged_at desc);