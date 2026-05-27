
drop policy if exists "plate-photos read" on storage.objects;
create policy "plate-photos read own" on storage.objects for select
  using (bucket_id = 'plate-photos' and auth.uid()::text = (storage.foldername(name))[1]);
