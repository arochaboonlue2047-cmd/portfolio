-- =============================================================================
-- Supabase Schema for Arocha Boonlue (Bumbim) Portfolio
-- มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น
-- =============================================================================

-- 1. Create Portfolio Data Table
create table if not exists public.portfolio_data (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.portfolio_data enable row level security;

-- 3. RLS Policies for portfolio_data (Allow public read & public anon editing)
drop policy if exists "Allow public read" on public.portfolio_data;
create policy "Allow public read"
  on public.portfolio_data
  for select
  using (true);

drop policy if exists "Allow anon insert" on public.portfolio_data;
create policy "Allow anon insert"
  on public.portfolio_data
  for insert
  with check (true);

drop policy if exists "Allow anon update" on public.portfolio_data;
create policy "Allow anon update"
  on public.portfolio_data
  for update
  using (true);

drop policy if exists "Allow anon delete" on public.portfolio_data;
create policy "Allow anon delete"
  on public.portfolio_data
  for delete
  using (true);

-- 4. Enable Supabase Realtime for instant synchronization
-- This enables real-time changes to be broadcasted to all connected browsers
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'portfolio_data'
  ) then
    alter publication supabase_realtime add table public.portfolio_data;
  end if;
exception
  when others then null;
end $$;

-- 5. Storage Bucket Configuration for Multimedia & Uploads
-- Bucket name: 'portfolio_files' (Public)
insert into storage.buckets (id, name, public)
values ('portfolio_files', 'portfolio_files', true)
on conflict (id) do update set public = true;

-- Storage Policies for 'portfolio_files'
drop policy if exists "Public Access for Portfolio Files" on storage.objects;
create policy "Public Access for Portfolio Files"
  on storage.objects for select
  using (bucket_id = 'portfolio_files');

drop policy if exists "Anon Upload for Portfolio Files" on storage.objects;
create policy "Anon Upload for Portfolio Files"
  on storage.objects for insert
  with check (bucket_id = 'portfolio_files');

drop policy if exists "Anon Update for Portfolio Files" on storage.objects;
create policy "Anon Update for Portfolio Files"
  on storage.objects for update
  using (bucket_id = 'portfolio_files');

drop policy if exists "Anon Delete for Portfolio Files" on storage.objects;
create policy "Anon Delete for Portfolio Files"
  on storage.objects for delete
  using (bucket_id = 'portfolio_files');
