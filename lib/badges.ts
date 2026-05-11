import {
  Crown,
  Flame,
  Frown,
  GraduationCap,
  RotateCcw,
  Shield,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Swords,
  Target,
  Trash2,
  TrendingDown,
  type LucideIcon
} from "lucide-react";
import { fixtureWinnerId, playedScore } from "@/lib/fixtures";
import type { Fixture, Player, Standing } from "@/types";

export type AwardTone = "gold" | "green" | "red" | "blue";
export type AwardKind = "honour" | "shame";

export type AwardWinner = {
  playerId: string;
  player: Player | null;
  value: number;
  detail?: string;
};

export type Award = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tone: AwardTone;
  kind: AwardKind;
  unit: string;
  winners: AwardWinner[];
};

type AwardInput = {
  players: Player[];
  fixtures: Fixture[];
  standings: Standing[];
};

export function computeAwards({ players, fixtures, standings }: AwardInput): Award[] {
  const playedFixtures = fixtures.filter(
    (fixture) =>
      fixture.played &&
      !fixture.voided &&
      fixture.home_score !== null &&
      fixture.away_score !== null
  );
  const playerById = new Map(players.map((player) => [player.id, player] as const));
  const findPlayer = (id: string) => playerById.get(id) ?? null;
  const playerName = (id: string) => findPlayer(id)?.name ?? "Player";

  return [
    firstBlood(playedFixtures, findPlayer, playerName),
    goalMachine(standings),
    ironWall(standings),
    cleanSheetMerchant(playedFixtures, findPlayer),
    comebackKing(standings),
    hatTrickHero(playedFixtures, findPlayer),
    derbyWinner(playedFixtures, findPlayer, playerName),
    woodenSpoon(standings),
    goalDrought(standings),
    sieve(standings),
    theChoker(standings),
    schooled(playedFixtures, findPlayer, playerName),
    bottleJob(standings)
  ];
}

export function awardsByKind(awards: Award[]): Record<AwardKind, Award[]> {
  return {
    honour: awards.filter((award) => award.kind === "honour"),
    shame: awards.filter((award) => award.kind === "shame")
  };
}

export function awardsForPlayer(awards: Award[], playerId: string): Award[] {
  return awards
    .map((award) => ({
      ...award,
      winners: award.winners.filter((winner) => winner.playerId === playerId)
    }))
    .filter((award) => award.winners.length > 0);
}

function firstBlood(
  fixtures: Fixture[],
  findPlayer: (id: string) => Player | null,
  playerName: (id: string) => string
): Award {
  const first = [...fixtures]
    .filter((fixture) => fixtureWinnerId(fixture) !== null)
    .sort(
      (a, b) =>
        new Date(a.played_at ?? a.created_at ?? 0).getTime() -
        new Date(b.played_at ?? b.created_at ?? 0).getTime()
    )[0];

  const winners: AwardWinner[] = [];
  if (first) {
    const winnerId = fixtureWinnerId(first);
    if (winnerId) {
      const opponentId =
        first.home_player_id === winnerId ? first.away_player_id : first.home_player_id;
      winners.push({
        playerId: winnerId,
        player: findPlayer(winnerId),
        value: 1,
        detail: `MD${first.matchday} vs ${playerName(opponentId)}`
      });
    }
  }

  return {
    id: "first-blood",
    name: "First Blood",
    description: "First player to win a match this season.",
    icon: Swords,
    tone: "gold",
    kind: "honour",
    unit: "match",
    winners
  };
}

function goalMachine(standings: Standing[]): Award {
  const eligible = standings.filter((standing) => standing.mp > 0);
  const max = eligible.reduce((best, standing) => Math.max(best, standing.gf), 0);
  const winners: AwardWinner[] =
    max > 0
      ? eligible
          .filter((standing) => standing.gf === max)
          .map((standing) => ({
            playerId: standing.player_id,
            player: standing.player ?? null,
            value: standing.gf,
            detail: `${standing.mp} matches`
          }))
      : [];

  return {
    id: "goal-machine",
    name: "Goal Machine",
    description: "Most goals scored across the season.",
    icon: Target,
    tone: "gold",
    kind: "honour",
    unit: "goals",
    winners
  };
}

function ironWall(standings: Standing[]): Award {
  const eligible = standings.filter((standing) => standing.mp > 0);
  const min = eligible.reduce((best, standing) => Math.min(best, standing.ga), Number.POSITIVE_INFINITY);
  const winners: AwardWinner[] = Number.isFinite(min)
    ? eligible
        .filter((standing) => standing.ga === min)
        .map((standing) => ({
          playerId: standing.player_id,
          player: standing.player ?? null,
          value: standing.ga,
          detail: `${standing.mp} matches`
        }))
    : [];

  return {
    id: "iron-wall",
    name: "Iron Wall",
    description: "Fewest goals conceded by an active player.",
    icon: Shield,
    tone: "blue",
    kind: "honour",
    unit: "conceded",
    winners
  };
}

function cleanSheetMerchant(
  fixtures: Fixture[],
  findPlayer: (id: string) => Player | null
): Award {
  const counts = new Map<string, number>();
  for (const fixture of fixtures) {
    if (fixture.home_score === 0 && fixture.away_score !== 0) {
      counts.set(fixture.away_player_id, (counts.get(fixture.away_player_id) ?? 0) + 1);
    }
    if (fixture.away_score === 0 && fixture.home_score !== 0) {
      counts.set(fixture.home_player_id, (counts.get(fixture.home_player_id) ?? 0) + 1);
    }
  }

  const max = [...counts.values()].reduce((best, value) => Math.max(best, value), 0);
  const winners: AwardWinner[] =
    max > 0
      ? [...counts.entries()]
          .filter(([, count]) => count === max)
          .map(([playerId, count]) => ({
            playerId,
            player: findPlayer(playerId),
            value: count,
            detail: count === 1 ? "1 clean sheet" : `${count} clean sheets`
          }))
      : [];

  return {
    id: "clean-sheet-merchant",
    name: "Clean Sheet Merchant",
    description: "Most matches where the opposition failed to score.",
    icon: ShieldCheck,
    tone: "green",
    kind: "honour",
    unit: "clean sheets",
    winners
  };
}

function comebackKing(standings: Standing[]): Award {
  const max = standings.reduce((best, standing) => Math.max(best, standing.comeback_wins), 0);
  const winners: AwardWinner[] =
    max > 0
      ? standings
          .filter((standing) => standing.comeback_wins === max)
          .map((standing) => ({
            playerId: standing.player_id,
            player: standing.player ?? null,
            value: standing.comeback_wins,
            detail: max === 1 ? "1 comeback win" : `${max} comeback wins`
          }))
      : [];

  return {
    id: "comeback-king",
    name: "Comeback King",
    description: "Most matches won from 2+ goals down.",
    icon: RotateCcw,
    tone: "green",
    kind: "honour",
    unit: "comebacks",
    winners
  };
}

function hatTrickHero(
  fixtures: Fixture[],
  findPlayer: (id: string) => Player | null
): Award {
  const counts = new Map<string, number>();
  for (const fixture of fixtures) {
    const homeFor = playedScore(fixture, fixture.home_player_id).forGoals;
    const awayFor = playedScore(fixture, fixture.away_player_id).forGoals;
    if (homeFor >= 3) {
      counts.set(fixture.home_player_id, (counts.get(fixture.home_player_id) ?? 0) + 1);
    }
    if (awayFor >= 3) {
      counts.set(fixture.away_player_id, (counts.get(fixture.away_player_id) ?? 0) + 1);
    }
  }

  const winners: AwardWinner[] = [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([playerId, count]) => ({
      playerId,
      player: findPlayer(playerId),
      value: count,
      detail: count === 1 ? "1 hat-trick" : `${count} hat-tricks`
    }));

  return {
    id: "hat-trick-hero",
    name: "Hat-Trick Hero",
    description: "Scored 3+ goals in a single match.",
    icon: Sparkles,
    tone: "gold",
    kind: "honour",
    unit: "hat-tricks",
    winners
  };
}

function derbyWinner(
  fixtures: Fixture[],
  findPlayer: (id: string) => Player | null,
  playerName: (id: string) => string
): Award {
  const pairs = new Map<string, Fixture[]>();
  for (const fixture of fixtures) {
    const key = [fixture.home_player_id, fixture.away_player_id].sort().join(":");
    pairs.set(key, [...(pairs.get(key) ?? []), fixture]);
  }

  const sweeps = new Map<string, { count: number; opponents: string[] }>();
  for (const pairFixtures of pairs.values()) {
    if (pairFixtures.length < 2) continue;
    const firstWinner = fixtureWinnerId(pairFixtures[0]);
    const secondWinner = fixtureWinnerId(pairFixtures[1]);
    if (!firstWinner || firstWinner !== secondWinner) continue;

    const opponentId =
      pairFixtures[0].home_player_id === firstWinner
        ? pairFixtures[0].away_player_id
        : pairFixtures[0].home_player_id;

    const entry = sweeps.get(firstWinner) ?? { count: 0, opponents: [] };
    entry.count += 1;
    entry.opponents.push(playerName(opponentId));
    sweeps.set(firstWinner, entry);
  }

  const winners: AwardWinner[] = [...sweeps.entries()]
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([playerId, { count, opponents }]) => ({
      playerId,
      player: findPlayer(playerId),
      value: count,
      detail: `Swept ${opponents.join(", ")}`
    }));

  return {
    id: "derby-winner",
    name: "Derby Winner",
    description: "Won both legs against the same opponent.",
    icon: Crown,
    tone: "gold",
    kind: "honour",
    unit: "sweeps",
    winners
  };
}

function bottleJob(standings: Standing[]): Award {
  const max = standings.reduce((best, standing) => Math.max(best, standing.rage_quits), 0);
  const winners: AwardWinner[] =
    max > 0
      ? standings
          .filter((standing) => standing.rage_quits === max)
          .map((standing) => ({
            playerId: standing.player_id,
            player: standing.player ?? null,
            value: standing.rage_quits,
            detail: max === 1 ? "1 rage quit" : `${max} rage quits`
          }))
      : [];

  return {
    id: "bottle-job",
    name: "Bottle Job",
    description: "Most rage quits — controller stayed on the sofa.",
    icon: Flame,
    tone: "red",
    kind: "shame",
    unit: "rage quits",
    winners
  };
}

function woodenSpoon(standings: Standing[]): Award {
  const active = standings.filter((standing) => standing.mp > 0);
  const winners: AwardWinner[] = [];

  if (active.length >= 2) {
    const min = active.reduce((worst, standing) => Math.min(worst, standing.pts), Number.POSITIVE_INFINITY);
    for (const standing of active) {
      if (standing.pts === min) {
        winners.push({
          playerId: standing.player_id,
          player: standing.player ?? null,
          value: standing.pts,
          detail: `${standing.mp} matches`
        });
      }
    }
  }

  return {
    id: "wooden-spoon",
    name: "Wooden Spoon",
    description: "Rock bottom of the league table.",
    icon: Trash2,
    tone: "red",
    kind: "shame",
    unit: "points",
    winners
  };
}

function goalDrought(standings: Standing[]): Award {
  const eligible = standings.filter((standing) => standing.mp > 0);
  const min = eligible.reduce(
    (worst, standing) => Math.min(worst, standing.gf),
    Number.POSITIVE_INFINITY
  );
  const winners: AwardWinner[] =
    Number.isFinite(min) && eligible.length >= 2
      ? eligible
          .filter((standing) => standing.gf === min)
          .map((standing) => ({
            playerId: standing.player_id,
            player: standing.player ?? null,
            value: standing.gf,
            detail: `${standing.mp} matches`
          }))
      : [];

  return {
    id: "goal-drought",
    name: "Goal Drought",
    description: "Fewest goals scored by an active player.",
    icon: TrendingDown,
    tone: "red",
    kind: "shame",
    unit: "goals",
    winners
  };
}

function sieve(standings: Standing[]): Award {
  const eligible = standings.filter((standing) => standing.mp > 0);
  const max = eligible.reduce((worst, standing) => Math.max(worst, standing.ga), 0);
  const winners: AwardWinner[] =
    max > 0 && eligible.length >= 2
      ? eligible
          .filter((standing) => standing.ga === max)
          .map((standing) => ({
            playerId: standing.player_id,
            player: standing.player ?? null,
            value: standing.ga,
            detail: `${standing.mp} matches`
          }))
      : [];

  return {
    id: "sieve",
    name: "Sieve",
    description: "Most goals conceded — defence on holiday.",
    icon: ShieldOff,
    tone: "red",
    kind: "shame",
    unit: "conceded",
    winners
  };
}

function theChoker(standings: Standing[]): Award {
  const eligible = standings.filter((standing) => standing.mp > 0);
  const max = eligible.reduce((worst, standing) => Math.max(worst, standing.losses), 0);
  const winners: AwardWinner[] =
    max > 0
      ? eligible
          .filter((standing) => standing.losses === max)
          .map((standing) => ({
            playerId: standing.player_id,
            player: standing.player ?? null,
            value: standing.losses,
            detail: `${standing.mp} matches`
          }))
      : [];

  return {
    id: "the-choker",
    name: "The Choker",
    description: "Most matches lost this season.",
    icon: Frown,
    tone: "red",
    kind: "shame",
    unit: "losses",
    winners
  };
}

function schooled(
  fixtures: Fixture[],
  findPlayer: (id: string) => Player | null,
  playerName: (id: string) => string
): Award {
  const records = new Map<string, { count: number; worst: { margin: number; opponent: string } }>();

  for (const fixture of fixtures) {
    const homeFor = fixture.home_score ?? 0;
    const awayFor = fixture.away_score ?? 0;
    const margin = Math.abs(homeFor - awayFor);
    if (margin < 5) continue;

    const loserId = homeFor < awayFor ? fixture.home_player_id : fixture.away_player_id;
    const winnerId = homeFor < awayFor ? fixture.away_player_id : fixture.home_player_id;

    const existing = records.get(loserId);
    if (!existing) {
      records.set(loserId, { count: 1, worst: { margin, opponent: playerName(winnerId) } });
    } else {
      existing.count += 1;
      if (margin > existing.worst.margin) {
        existing.worst = { margin, opponent: playerName(winnerId) };
      }
    }
  }

  const winners: AwardWinner[] = [...records.entries()]
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([playerId, { count, worst }]) => ({
      playerId,
      player: findPlayer(playerId),
      value: count,
      detail: `Worst: ${worst.margin}-goal loss to ${worst.opponent}`
    }));

  return {
    id: "schooled",
    name: "Schooled",
    description: "Lost a match by 5 or more goals.",
    icon: GraduationCap,
    tone: "red",
    kind: "shame",
    unit: "thrashings",
    winners
  };
}
