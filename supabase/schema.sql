create extension if not exists pgcrypto;

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  psn_tag text not null unique,
  avatar_color text,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Idempotent for projects already on the old schema:
alter table players add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
alter table players add column if not exists is_active boolean default true;

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text default 'setup' check (status in ('setup', 'active', 'complete')),
  created_at timestamptz default now()
);

create table if not exists fixtures (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  home_player_id uuid references players(id) on delete cascade,
  away_player_id uuid references players(id) on delete cascade,
  leg integer not null check (leg in (1, 2)),
  matchday integer not null,
  home_score integer,
  away_score integer,
  played boolean default false,
  rage_quit_player_id uuid references players(id),
  comeback_win boolean default false,
  result_screenshot_url text,
  played_at timestamptz,
  -- Blind dual-submission slots: each side submits their score; if they match, played flips true.
  home_submitted_home_score integer,
  home_submitted_away_score integer,
  home_submitted_at timestamptz,
  away_submitted_home_score integer,
  away_submitted_away_score integer,
  away_submitted_at timestamptz,
  dispute_open boolean default false,
  dispute_reason text,
  voided boolean default false,
  created_at timestamptz default now()
);

-- Idempotent for projects already on the old schema:
alter table fixtures add column if not exists home_submitted_home_score integer;
alter table fixtures add column if not exists home_submitted_away_score integer;
alter table fixtures add column if not exists home_submitted_at timestamptz;
alter table fixtures add column if not exists away_submitted_home_score integer;
alter table fixtures add column if not exists away_submitted_away_score integer;
alter table fixtures add column if not exists away_submitted_at timestamptz;
alter table fixtures add column if not exists dispute_open boolean default false;
alter table fixtures add column if not exists dispute_reason text;
alter table fixtures add column if not exists voided boolean default false;

create table if not exists standings (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  mp integer default 0,
  wins integer default 0,
  draws integer default 0,
  losses integer default 0,
  gf integer default 0,
  ga integer default 0,
  pts integer default 0,
  bonus_pts integer default 0,
  blowout_wins integer default 0,
  comeback_wins integer default 0,
  rage_quits integer default 0,
  updated_at timestamptz default now(),
  unique(season_id, player_id)
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fixtures'
  ) then
    alter publication supabase_realtime add table fixtures;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'standings'
  ) then
    alter publication supabase_realtime add table standings;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;
end $$;

alter table players enable row level security;
alter table seasons enable row level security;
alter table fixtures enable row level security;
alter table standings enable row level security;

drop policy if exists "Public read players" on players;
drop policy if exists "Public read seasons" on seasons;
drop policy if exists "Public read fixtures" on fixtures;
drop policy if exists "Public read standings" on standings;

create policy "Public read players" on players for select using (true);
create policy "Public read seasons" on seasons for select using (true);
create policy "Public read fixtures" on fixtures for select using (true);
create policy "Public read standings" on standings for select using (true);

-- Mutations are performed by the server using SUPABASE_SERVICE_ROLE_KEY.
-- Create a public storage bucket named `screenshots` in Supabase Storage.
