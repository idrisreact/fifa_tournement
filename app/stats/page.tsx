import { Award as AwardIcon, Skull } from "lucide-react";
import { AchievementBadge } from "@/components/AchievementBadge";
import { HeadToHeadLookup } from "@/components/HeadToHeadLookup";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatsCharts } from "@/components/StatsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { awardsByKind, computeAwards } from "@/lib/badges";
import { getTournamentData } from "@/lib/data";
import { sortStandings } from "@/lib/standings";

export default async function StatsPage() {
  const { players, fixtures, standings } = await getTournamentData();
  const sortedStandings = sortStandings(standings, fixtures);

  const topScorer = [...sortedStandings].sort((a, b) => b.gf - a.gf)[0];
  const bestWinRate = [...sortedStandings].sort((a, b) => {
    const bRate = b.mp ? b.wins / b.mp : 0;
    const aRate = a.mp ? a.wins / a.mp : 0;
    return bRate - aRate;
  })[0];
  const blowoutKing = [...sortedStandings].sort((a, b) => b.blowout_wins - a.blowout_wins)[0];
  const comebackKing = [...sortedStandings].sort((a, b) => b.comeback_wins - a.comeback_wins)[0];
  const cleanest = [...sortedStandings].sort((a, b) => a.rage_quits - b.rage_quits)[0];
  const awards = computeAwards({ players, fixtures, standings: sortedStandings });
  const { honour, shame } = awardsByKind(awards);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Player Stats"
        description="Awards, player comparisons, goal output, and two-leg head-to-head records."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Top Goal Scorer" value={topScorer?.gf ?? 0} name={topScorer?.player?.name ?? "-"} detail="Goals for" />
        <StatCard
          label="Best Win Rate"
          value={`${Math.round(((bestWinRate?.wins ?? 0) / Math.max(bestWinRate?.mp ?? 1, 1)) * 100)}%`}
          name={bestWinRate?.player?.name ?? "-"}
          detail={`${bestWinRate?.wins ?? 0} wins`}
        />
        <StatCard label="Most Blowouts" value={blowoutKing?.blowout_wins ?? 0} name={blowoutKing?.player?.name ?? "-"} detail="Wins by 3+ goals" />
        <StatCard label="Most Comebacks" value={comebackKing?.comeback_wins ?? 0} name={comebackKing?.player?.name ?? "-"} detail="2+ goal comeback wins" />
        <StatCard label="Cleanest Player" value={cleanest?.rage_quits ?? 0} name={cleanest?.player?.name ?? "-"} detail="Rage quits" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <AwardIcon className="h-5 w-5 text-gold" />
              Hall of Fame
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {honour.map((award) => (
              <AchievementBadge key={award.id} award={award} />
            ))}
          </div>
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {shame.map((award) => (
              <AchievementBadge key={award.id} award={award} />
            ))}
          </div>
        </CardContent>
      </Card>

      <StatsCharts standings={sortedStandings} />
      <HeadToHeadLookup players={players} fixtures={fixtures} />
    </div>
  );
}
