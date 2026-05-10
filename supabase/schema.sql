create extension if not exists pgcrypto;

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  psn_tag text not null unique,
  avatar_color text,
  created_at timestamptz default now()
);

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
  created_at timestamptz default now()
);

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

alter publication supabase_realtime add table fixtures;
alter publication supabase_realtime add table standings;

alter table players enable row level security;
alter table seasons enable row level security;
alter table fixtures enable row level security;
alter table standings enable row level security;

create policy "Public read players" on players for select using (true);
create policy "Public read seasons" on seasons for select using (true);
create policy "Public read fixtures" on fixtures for select using (true);
create policy "Public read standings" on standings for select using (true);

-- Mutations are performed by the server using SUPABASE_SERVICE_ROLE_KEY.
-- Create a public storage bucket named `screenshots` in Supabase Storage.
