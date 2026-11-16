-- Private storage for progress photos. Objects must live under
-- '<auth.uid()>/...'; access is by short-lived signed URLs only.
-- Runs only on Supabase (requires the storage schema).
insert into storage.buckets (id, name, public)
values ('body-photos', 'body-photos', false)
on conflict (id) do update set public = false;

create policy body_photos_read_own on storage.objects for select to authenticated
  using (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy body_photos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy body_photos_update_own on storage.objects for update to authenticated
  using (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy body_photos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text);
