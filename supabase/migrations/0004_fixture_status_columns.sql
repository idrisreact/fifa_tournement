-- Backfills fixture status/submission columns for projects created before
-- these fields were added to the base schema.

alter table fixtures add column if not exists home_submitted_home_score integer;
alter table fixtures add column if not exists home_submitted_away_score integer;
alter table fixtures add column if not exists home_submitted_at timestamptz;
alter table fixtures add column if not exists away_submitted_home_score integer;
alter table fixtures add column if not exists away_submitted_away_score integer;
alter table fixtures add column if not exists away_submitted_at timestamptz;
alter table fixtures add column if not exists dispute_open boolean default false;
alter table fixtures add column if not exists dispute_reason text;
alter table fixtures add column if not exists voided boolean default false;
