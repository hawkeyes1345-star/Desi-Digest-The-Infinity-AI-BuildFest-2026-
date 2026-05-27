
alter table public.meal_logs add column if not exists image_url text;
alter table public.meal_logs add column if not exists analysis jsonb;

insert into storage.buckets (id, name, public)
values ('plate-photos', 'plate-photos', true)
on conflict (id) do nothing;

create policy "plate-photos read" on storage.objects for select
  using (bucket_id = 'plate-photos');

create policy "plate-photos insert own" on storage.objects for insert
  with check (bucket_id = 'plate-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "plate-photos delete own" on storage.objects for delete
  using (bucket_id = 'plate-photos' and auth.uid()::text = (storage.foldername(name))[1]);
