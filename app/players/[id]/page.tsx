import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award as AwardIcon, CalendarDays, MessageSquare, Skull, Target, Trophy } from "lucide-react";
import { AchievementBadge } from "@/components/AchievementBadge";
import { AvatarCircle } from "@/components/AvatarCircle";
import { FixtureCard } from "@/components/FixtureCard";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentPlayer, isAdminUser } from "@/lib/auth";
import { awardsByKind, awardsForPlayer, computeAwards } from "@/lib/badges";
import { getTournamentData } from "@/lib/data";
import { sortStandings } from "@/lib/standings";
import { formatRecord, goalDifference } from "@/lib/utils";

type Props = {
  params: { id: string };
};

export default async function PlayerProfilePage({ params }: Props) {
  const [
    { players, fixtures, standings, comments, reactions, predictions, usingDemoData },
    currentPlayer,
    isAdmin
  ] = await Promise.all([getTournamentData(), getCurrentPlayer(), isAdminUser()]);
  const player = players.find((item) => item.id === params.id);
  if (!player) notFound();

  const sortedStandings = sortStandings(standings, fixtures);
  const standing = sortedStandings.find((item) => item.player_id === player.id);
  const position = sortedStandings.findIndex((item) => item.player_id === player.id) + 1;
  const playerFixtures = fixtures.filter(
    (fixture) => fixture.home_player_id === player.id || fixture.away_player_id === player.id
  );
  const recentFixtures = playerFixtures
    .filter((fixture) => fixture.played)
    .sort((a, b) => new Date(b.played_at ?? 0).getTime() - new Date(a.played_at ?? 0).getTime())
    .slice(0, 4);
  const upcomingFixtures = playerFixtures
    .filter((fixture) => !fixture.played && !fixture.voided)
    .slice(0, 4);
  const playerPredictions = predictions.filter((prediction) => prediction.player_id === player.id);
  const exactPicks = playerPredictions.filter((prediction) => {
    const fixture = fixtures.find((item) => item.id === prediction.fixture_id);
    return (
      fixture?.played &&
      fixture.home_score === prediction.home_score &&
      fixture.away_score === prediction.away_score
    );
  }).length;
  const playerComments = comments.filter((comment) => comment.player_id === player.id).slice(-5);
  const awards = computeAwards({ players, fixtures, standings: sortedStandings });
  const playerAwards = awardsForPlayer(awards, player.id);
  const { honour: honourBadges, shame: shameBadges } = awardsByKind(playerAwards);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/squad">
          <ArrowLeft className="h-4 w-4" />
          Squad
        </Link>
      </Button>

      <PageHeader
        eyebrow="Player profile"
        title={player.name}
        description={`@${player.psn_tag}`}
        action={<AvatarCircle player={player} />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Position" value={position ? `#${position}` : "-"} name="Table" detail={`${standing?.pts ?? 0} points`} />
        <StatCard
          label="Record"
          value={formatRecord(standing?.wins ?? 0, standing?.draws ?? 0, standing?.losses ?? 0)}
          name="League"
          detail={`${standing?.mp ?? 0} played`}
        />
        <StatCard label="Goal Difference" value={goalDifference(standing ?? { gf: 0, ga: 0 })} name="Goals" detail={`${standing?.gf ?? 0} for, ${standing?.ga ?? 0} against`} />
        <StatCard label="Predictions" value={exactPicks} name="Exact picks" detail={`${playerPredictions.length} total picks`} />
        <StatCard label="Bonus Points" value={standing?.bonus_pts ?? 0} name="Extras" detail={`${standing?.comeback_wins ?? 0} comebacks`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <AwardIcon className="h-5 w-5 text-gold" />
                Achievements
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {honourBadges.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {honourBadges.map((award) => (
                  <AchievementBadge key={award.id} award={award} showWinners={false} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                No badges yet. Win a match, score a hat-trick, or sweep an opponent to earn one.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Skull className="h-5 w-5 text-red-300" />
                Wall of Shame
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shameBadges.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {shameBadges.map((award) => (
                  <AchievementBadge key={award.id} award={award} showWinners={false} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Spotless record — no shame badges. For now.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentFixtures.length ? (
              recentFixtures.map((fixture) => (
                <FixtureCard
                  key={fixture.id}
                  fixture={fixture}
                  players={players}
                  compact
                  usingDemoData={usingDemoData}
                  isAdmin={isAdmin}
                  currentPlayerId={currentPlayer?.id ?? null}
                />
              ))
            ) : (
              <p className="text-sm text-muted">No completed matches yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-white/[0.05] p-3">
              <p className="inline-flex items-center gap-2 font-label text-sm uppercase tracking-wide text-muted">
                <Target className="h-4 w-4 text-gold" />
                Prediction Accuracy
              </p>
              <p className="mt-1 text-sm text-muted">
                {playerPredictions.length
                  ? `${exactPicks} exact from ${playerPredictions.length} predictions.`
                  : "No predictions made yet."}
              </p>
            </div>
            <div className="rounded-md bg-white/[0.05] p-3">
              <p className="inline-flex items-center gap-2 font-label text-sm uppercase tracking-wide text-muted">
                <MessageSquare className="h-4 w-4 text-pitch" />
                Recent Comments
              </p>
              <div className="mt-2 space-y-2">
                {playerComments.length ? (
                  playerComments.map((comment) => (
                    <p key={comment.id} className="break-words text-sm text-muted">
                      {comment.body}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted">No comments yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-md bg-white/[0.05] p-3">
              <p className="inline-flex items-center gap-2 font-label text-sm uppercase tracking-wide text-muted">
                <Trophy className="h-4 w-4 text-gold" />
                Reactions Earned
              </p>
              <p className="mt-1 text-sm text-muted">
                {reactions.filter((reaction) => {
                  const fixture = fixtures.find((item) => item.id === reaction.fixture_id);
                  return fixture?.home_player_id === player.id || fixture?.away_player_id === player.id;
                }).length}{" "}
                across their fixtures.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-pitch" />
              Upcoming Fixtures
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 xl:grid-cols-2">
          {upcomingFixtures.length ? (
            upcomingFixtures.map((fixture) => (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                players={players}
                usingDemoData={usingDemoData}
                isAdmin={isAdmin}
                currentPlayerId={currentPlayer?.id ?? null}
                comments={comments.filter((comment) => comment.fixture_id === fixture.id)}
                reactions={reactions.filter((reaction) => reaction.fixture_id === fixture.id)}
                predictions={predictions.filter((prediction) => prediction.fixture_id === fixture.id)}
              />
            ))
          ) : (
            <p className="text-sm text-muted">No upcoming fixtures.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
