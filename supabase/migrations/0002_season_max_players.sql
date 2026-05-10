-- Adds a configurable squad-size cap per season.
-- Default of 12 preserves the historical behaviour. Hard cap of 20 protects
-- against blowing up fixture generation (n*(n-1) grows quickly).

alter table seasons
  add column if not exists max_players integer not null default 12;

alter table seasons
  drop constraint if exists seasons_max_players_check;

alter table seasons
  add constraint seasons_max_players_check
  check (max_players between 2 and 20);
