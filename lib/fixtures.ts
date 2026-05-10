import type { Fixture, Player } from "@/types";

type GeneratedFixture = Pick<
  Fixture,
  "season_id" | "home_player_id" | "away_player_id" | "leg" | "matchday"
>;

export function generateRoundRobin(players: Player[], seasonId = ""): GeneratedFixture[] {
  const ps: Array<Player | null> = [...players];
  if (ps.length % 2 !== 0) ps.push(null);

  const n = ps.length;
  const rounds = n - 1;
  const fixtures: GeneratedFixture[] = [];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const home = ps[i];
      const away = ps[n - 1 - i];

      if (home && away) {
        fixtures.push({
          season_id: seasonId,
          home_player_id: home.id,
          away_player_id: away.id,
          leg: 1,
          matchday: round + 1
        });
        fixtures.push({
          season_id: seasonId,
          home_player_id: away.id,
          away_player_id: home.id,
          leg: 2,
          matchday: rounds + round + 1
        });
      }
    }

    ps.splice(1, 0, ps.pop()!);
  }

  return fixtures;
}

export function playedScore(fixture: Fixture, playerId: string) {
  if (fixture.home_score === null || fixture.away_score === null) {
    return { forGoals: 0, againstGoals: 0 };
  }

  if (fixture.home_player_id === playerId) {
    return { forGoals: fixture.home_score, againstGoals: fixture.away_score };
  }

  return { forGoals: fixture.away_score, againstGoals: fixture.home_score };
}

export function fixtureWinnerId(fixture: Fixture) {
  if (fixture.home_score === null || fixture.away_score === null) return null;
  if (fixture.home_score > fixture.away_score) return fixture.home_player_id;
  if (fixture.away_score > fixture.home_score) return fixture.away_player_id;
  return null;
}

export function fixtureLoserId(fixture: Fixture) {
  if (fixture.home_score === null || fixture.away_score === null) return null;
  if (fixture.home_score < fixture.away_score) return fixture.home_player_id;
  if (fixture.away_score < fixture.home_score) return fixture.away_player_id;
  return null;
}

export function scoreMargin(fixture: Fixture) {
  if (fixture.home_score === null || fixture.away_score === null) return 0;
  return Math.abs(fixture.home_score - fixture.away_score);
}

export function getHeadToHeadResult(fixtures: Fixture[], playerAId: string, playerBId: string) {
  const legs = fixtures
    .filter(
      (fixture) =>
        fixture.played &&
        [fixture.home_player_id, fixture.away_player_id].includes(playerAId) &&
        [fixture.home_player_id, fixture.away_player_id].includes(playerBId) &&
        fixture.home_score !== null &&
        fixture.away_score !== null
    )
    .sort((a, b) => a.leg - b.leg);

  const aggregateA = legs.reduce((total, fixture) => total + playedScore(fixture, playerAId).forGoals, 0);
  const aggregateB = legs.reduce((total, fixture) => total + playedScore(fixture, playerBId).forGoals, 0);
  const awayGoalsA = legs.reduce((total, fixture) => {
    return fixture.away_player_id === playerAId ? total + (fixture.away_score ?? 0) : total;
  }, 0);
  const awayGoalsB = legs.reduce((total, fixture) => {
    return fixture.away_player_id === playerBId ? total + (fixture.away_score ?? 0) : total;
  }, 0);

  let winner: string | "draw" | null = null;
  if (legs.length === 2) {
    if (aggregateA > aggregateB) winner = playerAId;
    else if (aggregateB > aggregateA) winner = playerBId;
    else if (awayGoalsA > awayGoalsB) winner = playerAId;
    else if (awayGoalsB > awayGoalsA) winner = playerBId;
    else winner = "draw";
  }

  return {
    playerAId,
    playerBId,
    aggregateA,
    aggregateB,
    awayGoalsA,
    awayGoalsB,
    winner,
    fixtures: legs
  };
}
