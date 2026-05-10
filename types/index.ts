export type SeasonStatus = "setup" | "active" | "complete";

export type Player = {
  id: string;
  name: string;
  psn_tag: string;
  avatar_color: string | null;
  created_at?: string;
};

export type Season = {
  id: string;
  name: string;
  status: SeasonStatus;
  created_at?: string;
};

export type Fixture = {
  id: string;
  season_id: string;
  home_player_id: string;
  away_player_id: string;
  leg: 1 | 2;
  matchday: number;
  home_score: number | null;
  away_score: number | null;
  played: boolean;
  rage_quit_player_id: string | null;
  comeback_win: boolean;
  result_screenshot_url: string | null;
  played_at: string | null;
  created_at?: string;
  home_player?: Player | null;
  away_player?: Player | null;
};

export type Standing = {
  id?: string;
  season_id: string;
  player_id: string;
  mp: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  pts: number;
  bonus_pts: number;
  blowout_wins: number;
  comeback_wins: number;
  rage_quits: number;
  updated_at?: string;
  player?: Player | null;
};

export type TournamentData = {
  season: Season;
  players: Player[];
  fixtures: Fixture[];
  standings: Standing[];
  usingDemoData: boolean;
};

export type FormResult = "W" | "D" | "L";

export type HeadToHeadSummary = {
  playerAId: string;
  playerBId: string;
  aggregateA: number;
  aggregateB: number;
  awayGoalsA: number;
  awayGoalsB: number;
  winner: string | "draw" | null;
  fixtures: Fixture[];
};
