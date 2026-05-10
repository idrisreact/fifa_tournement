-- fixture_uploads: per-side screenshot proof for a fixture.
-- Each fixture can have multiple uploads (home, away, dispute evidence, etc.).

create table if not exists fixture_uploads (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  side text not null check (side in ('home', 'away', 'dispute')),
  storage_path text not null,
  public_url text not null,
  content_type text,
  size_bytes integer,
  note text,
  created_at timestamptz not null default now(),
  unique (fixture_id, player_id, side)
);

create index if not exists fixture_uploads_fixture_id_idx on fixture_uploads(fixture_id);
create index if not exists fixture_uploads_player_id_idx on fixture_uploads(player_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fixture_uploads'
  ) then
    alter publication supabase_realtime add table fixture_uploads;
  end if;
end $$;

alter table fixture_uploads enable row level security;

drop policy if exists "Public read fixture_uploads" on fixture_uploads;
create policy "Public read fixture_uploads" on fixture_uploads for select using (true);

-- Mutations performed by the server using SUPABASE_SERVICE_ROLE_KEY.
-- Files live in the public `screenshots` storage bucket; `storage_path`
-- is the object key inside that bucket and `public_url` is its resolved URL.

-- Ensure the public `screenshots` bucket exists.
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- Public read of screenshot objects (mirrors the table's public read policy).
drop policy if exists "Public read screenshots" on storage.objects;
create policy "Public read screenshots" on storage.objects
  for select using (bucket_id = 'screenshots');
