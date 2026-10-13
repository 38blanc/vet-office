-- (optioneel) veiligere variant van de opslagregel voor de boekhouder
drop policy if exists "vet-files lezen boekhouder" on storage.objects;
create or replace function public.vet_heeft_toegang_map(p_map text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.access a where a.owner::text = p_map and a.member = (select auth.uid()));
$$;
revoke all on function public.vet_heeft_toegang_map(text) from public, anon;
grant execute on function public.vet_heeft_toegang_map(text) to authenticated;
create policy "vet-files lezen boekhouder" on storage.objects for select to authenticated
  using (bucket_id = 'vet-files' and public.vet_heeft_toegang_map((storage.foldername(name))[1]));
-- wijzigen: ook bij het overschrijven controleren dat het bestand in je eigen map blijft
drop policy if exists "vet-files wijzigen" on storage.objects;
create policy "vet-files wijzigen" on storage.objects for update to authenticated
  using (bucket_id = 'vet-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'vet-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
