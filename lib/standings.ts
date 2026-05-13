import type { Fixture, Player, Standing } from "@/types";
import { fixtureLoserId, fixtureWinnerId, playedScore, scoreMargin } from "@/lib/fixtures";
import { goalDifference } from "@/lib/utils";

export function calculateStandings(
  seasonId: string,
  players: Player[],
  fixtures: Fixture[],
  manualBonuses?: Map<string, number>
): Standing[] {
  const playedFixtures = fixtures.filter(
    (fixture) =>
      fixture.played &&
      !fixture.voided &&
      fixture.home_score !== null &&
      fixture.away_score !== null
  );

  const rows = new Map<string, Standing>();

  players.forEach((player) => {
    rows.set(player.id, {
      season_id: seasonId,
      player_id: player.id,
      mp: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      pts: 0,
      bonus_pts: 0,
      manual_bonus_pts: 0,
      blowout_wins: 0,
      comeback_wins: 0,
      rage_quits: 0,
      player
    });
  });

  for (const fixture of playedFixtures) {
    const home = rows.get(fixture.home_player_id);
    const away = rows.get(fixture.away_player_id);
    if (!home || !away) continue;

    home.mp += 1;
    away.mp += 1;
    home.gf += fixture.home_score ?? 0;
    home.ga += fixture.away_score ?? 0;
    away.gf += fixture.away_score ?? 0;
    away.ga += fixture.home_score ?? 0;

    if ((fixture.home_score ?? 0) > (fixture.away_score ?? 0)) {
      home.wins += 1;
      away.losses += 1;
      home.pts += 3;
    } else if ((fixture.away_score ?? 0) > (fixture.home_score ?? 0)) {
      away.wins += 1;
      home.losses += 1;
      away.pts += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.pts += 1;
      away.pts += 1;
    }

    const winnerId = fixtureWinnerId(fixture);
    if (winnerId && scoreMargin(fixture) >= 3) {
      const winner = rows.get(winnerId);
      if (winner) {
        winner.bonus_pts += 1;
        winner.pts += 1;
        winner.blowout_wins += 1;
      }
    }

    if (winnerId && fixture.comeback_win) {
      const winner = rows.get(winnerId);
      if (winner) {
        winner.bonus_pts += 1;
        winner.pts += 1;
        winner.comeback_wins += 1;
      }
    }

    if (fixture.rage_quit_player_id) {
      const offender = rows.get(fixture.rage_quit_player_id);
      if (offender) offender.rage_quits += 1;
    }
  }

  awardDoubleLegBonuses(rows, playedFixtures);

  for (const standing of rows.values()) {
    if (standing.rage_quits >= 2) standing.pts -= 3;
  }

  if (manualBonuses) {
    for (const standing of rows.values()) {
      const adjustment = manualBonuses.get(standing.player_id) ?? 0;
      standing.manual_bonus_pts = adjustment;
      standing.pts += adjustment;
    }
  }

  return sortStandings([...rows.values()], playedFixtures);
}

function awardDoubleLegBonuses(rows: Map<string, Standing>, fixtures: Fixture[]) {
  const pairs = new Map<string, Fixture[]>();

  for (const fixture of fixtures) {
    const key = [fixture.home_player_id, fixture.away_player_id].sort().join(":");
    pairs.set(key, [...(pairs.get(key) ?? []), fixture]);
  }

  for (const pairFixtures of pairs.values()) {
    if (pairFixtures.length < 2) continue;
    const firstWinner = fixtureWinnerId(pairFixtures[0]);
    const secondWinner = fixtureWinnerId(pairFixtures[1]);

    if (firstWinner && firstWinner === secondWinner) {
      const row = rows.get(firstWinner);
      if (row) {
        row.bonus_pts += 3;
        row.pts += 3;
      }
    }
  }
}

export function sortStandings(standings: Standing[], fixtures: Fixture[]) {
  return [...standings].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;

    const headToHead = compareHeadToHead(a.player_id, b.player_id, fixtures);
    if (headToHead !== 0) return headToHead;

    const gdDelta = goalDifference(b) - goalDifference(a);
    if (gdDelta !== 0) return gdDelta;

    if (b.gf !== a.gf) return b.gf - a.gf;

    return (a.player?.name ?? "").localeCompare(b.player?.name ?? "");
  });
}

function compareHeadToHead(playerAId: string, playerBId: string, fixtures: Fixture[]) {
  let pointsA = 0;
  let pointsB = 0;
  let awayGoalsA = 0;
  let awayGoalsB = 0;

  for (const fixture of fixtures) {
    const isHeadToHead =
      fixture.played &&
      [fixture.home_player_id, fixture.away_player_id].includes(playerAId) &&
      [fixture.home_player_id, fixture.away_player_id].includes(playerBId);
    if (!isHeadToHead || fixture.home_score === null || fixture.away_score === null) continue;

    const scoreA = playedScore(fixture, playerAId);
    const scoreB = playedScore(fixture, playerBId);
    if (scoreA.forGoals > scoreB.forGoals) pointsA += 3;
    else if (scoreB.forGoals > scoreA.forGoals) pointsB += 3;
    else {
      pointsA += 1;
      pointsB += 1;
    }

    if (fixture.away_player_id === playerAId) awayGoalsA += fixture.away_score;
    if (fixture.away_player_id === playerBId) awayGoalsB += fixture.away_score;
  }

  if (pointsA !== pointsB) return pointsB - pointsA;
  if (awayGoalsA !== awayGoalsB) return awayGoalsB - awayGoalsA;
  return 0;
}

export function getForm(fixtures: Fixture[], playerId: string) {
  return fixtures
    .filter(
      (fixture) =>
        fixture.played &&
        (fixture.home_player_id === playerId || fixture.away_player_id === playerId) &&
        fixture.home_score !== null &&
        fixture.away_score !== null
    )
    .sort((a, b) => new Date(b.played_at ?? b.created_at ?? 0).getTime() - new Date(a.played_at ?? a.created_at ?? 0).getTime())
    .slice(0, 5)
    .map((fixture) => {
      const winnerId = fixtureWinnerId(fixture);
      const loserId = fixtureLoserId(fixture);
      if (winnerId === playerId) return "W";
      if (loserId === playerId) return "L";
      return "D";
    });
}
