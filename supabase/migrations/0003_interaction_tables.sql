create table if not exists fixture_comments (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 280),
  created_at timestamptz default now()
);

create table if not exists fixture_reactions (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  reaction text not null check (reaction in ('fire', 'shock', 'laugh', 'respect')),
  created_at timestamptz default now(),
  unique(fixture_id, player_id, reaction)
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  home_score integer not null check (home_score between 0 and 99),
  away_score integer not null check (away_score between 0 and 99),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(fixture_id, player_id)
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fixture_comments'
  ) then
    alter publication supabase_realtime add table fixture_comments;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fixture_reactions'
  ) then
    alter publication supabase_realtime add table fixture_reactions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'predictions'
  ) then
    alter publication supabase_realtime add table predictions;
  end if;
end $$;

alter table fixture_comments enable row level security;
alter table fixture_reactions enable row level security;
alter table predictions enable row level security;

drop policy if exists "Public read fixture comments" on fixture_comments;
drop policy if exists "Public read fixture reactions" on fixture_reactions;
drop policy if exists "Public read predictions" on predictions;

create policy "Public read fixture comments" on fixture_comments for select using (true);
create policy "Public read fixture reactions" on fixture_reactions for select using (true);
create policy "Public read predictions" on predictions for select using (true);
