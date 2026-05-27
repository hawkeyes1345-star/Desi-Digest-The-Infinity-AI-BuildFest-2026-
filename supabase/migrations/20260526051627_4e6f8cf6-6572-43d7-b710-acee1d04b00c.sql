
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chat_threads_user_idx on public.chat_threads(user_id, updated_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  parts jsonb not null,
  created_at timestamptz not null default now()
);
create index chat_messages_thread_idx on public.chat_messages(thread_id, created_at asc);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

create policy "own threads select" on public.chat_threads for select using (auth.uid() = user_id);
create policy "own threads insert" on public.chat_threads for insert with check (auth.uid() = user_id);
create policy "own threads update" on public.chat_threads for update using (auth.uid() = user_id);
create policy "own threads delete" on public.chat_threads for delete using (auth.uid() = user_id);

create policy "own messages select" on public.chat_messages for select using (auth.uid() = user_id);
create policy "own messages insert" on public.chat_messages for insert with check (auth.uid() = user_id);
create policy "own messages delete" on public.chat_messages for delete using (auth.uid() = user_id);

create or replace function public.touch_thread_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.chat_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;

create trigger chat_messages_touch_thread
after insert on public.chat_messages
for each row execute function public.touch_thread_updated_at();
