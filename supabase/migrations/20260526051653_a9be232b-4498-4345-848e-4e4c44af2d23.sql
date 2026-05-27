
create or replace function public.touch_thread_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  update public.chat_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;
revoke execute on function public.touch_thread_updated_at() from public, anon, authenticated;
