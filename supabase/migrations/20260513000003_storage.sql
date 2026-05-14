-- Storage bucket for compliance documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Only authenticated users can upload/read their own business docs
-- (enforced at API layer via service role + RLS on documents table)
create policy "Authenticated users can upload documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents');

create policy "Authenticated users can read their documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents');

create policy "Authenticated users can delete their documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents');
