import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Target, Trophy } from "lucide-react";
import { FixtureCard } from "@/components/FixtureCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Fixture, Player, Prediction, Standing } from "@/types";

type Props = {
  currentPlayer: Player;
  players: Player[];
  fixtures: Fixture[];
  /** Must be pre-sorted with sortStandings — position is taken directly from this order. */
  sortedStandings: Standing[];
  predictions: Prediction[];
};

export function MyDashboard({
  currentPlayer,
  players,
  fixtures,
  sortedStandings,
  predictions
}: Props) {
  const myStanding = sortedStandings.find((standing) => standing.player_id === currentPlayer.id);
  const position = sortedStandings.findIndex((standing) => standing.player_id === currentPlayer.id) + 1;
  const nextFixtures = fixtures
    .filter(
      (fixture) =>
        !fixture.played &&
        !fixture.voided &&
        (fixture.home_player_id === currentPlayer.id || fixture.away_player_id === currentPlayer.id)
    )
    .slice(0, 2);
  const awaitingMe = fixtures.filter((fixture) => {
    if (fixture.played || fixture.voided || fixture.dispute_open) return false;
    if (fixture.home_player_id === currentPlayer.id) {
      return !!fixture.away_submitted_at && !fixture.home_submitted_at;
    }
    if (fixture.away_player_id === currentPlayer.id) {
      return !!fixture.home_submitted_at && !fixture.away_submitted_at;
    }
    return false;
  });
  const myPredictions = predictions.filter((prediction) => prediction.player_id === currentPlayer.id);
  const exactPicks = myPredictions.filter((prediction) => {
    const fixture = fixtures.find((item) => item.id === prediction.fixture_id);
    return (
      fixture?.played &&
      fixture.home_score === prediction.home_score &&
      fixture.away_score === prediction.away_score
    );
  }).length;

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>My Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-white/[0.05] p-3">
              <p className="font-label text-xs uppercase tracking-wide text-muted">Position</p>
              <p className="font-display text-4xl leading-none text-white">
                {position ? `#${position}` : "-"}
              </p>
            </div>
            <div className="rounded-md bg-white/[0.05] p-3">
              <p className="font-label text-xs uppercase tracking-wide text-muted">Points</p>
              <p className="font-display text-4xl leading-none text-gold">{myStanding?.pts ?? 0}</p>
            </div>
            <div className="rounded-md bg-white/[0.05] p-3">
              <p className="inline-flex items-center gap-1 font-label text-xs uppercase tracking-wide text-muted">
                <Clock className="h-3 w-3" />
                Confirm
              </p>
              <p className="font-display text-4xl leading-none text-white">{awaitingMe.length}</p>
            </div>
            <div className="rounded-md bg-white/[0.05] p-3">
              <p className="inline-flex items-center gap-1 font-label text-xs uppercase tracking-wide text-muted">
                <Target className="h-3 w-3" />
                Exact Picks
              </p>
              <p className="font-display text-4xl leading-none text-white">{exactPicks}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/fixtures">
                Fixtures
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href={`/players/${currentPlayer.id}`}>
                Profile
                <Trophy className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{awaitingMe.length ? "Needs Your Confirmation" : "Next Up"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(awaitingMe.length ? awaitingMe : nextFixtures).length ? (
            (awaitingMe.length ? awaitingMe : nextFixtures).map((fixture) => (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                players={players}
                compact
                currentPlayerId={currentPlayer.id}
              />
            ))
          ) : (
            <div className="rounded-md bg-white/[0.05] p-4 text-sm text-muted">
              <CheckCircle2 className="mb-2 h-5 w-5 text-pitch" />
              You are all caught up for now.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
