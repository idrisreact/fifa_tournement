import { getTournamentData } from "@/lib/data";
import { sortStandings } from "@/lib/standings";
import { goalDifference } from "@/lib/utils";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { StandingsTable } from "@/components/StandingsTable";

export default async function StandingsPage() {
  const { fixtures, standings } = await getTournamentData();
  const sortedStandings = sortStandings(standings, fixtures);
  const leader = sortedStandings[0];
  const bestAttack = [...sortedStandings].sort((a, b) => b.gf - a.gf)[0];
  const bestDefense = [...sortedStandings].sort((a, b) => a.ga - b.ga)[0];
  const bestGd = [...sortedStandings].sort((a, b) => goalDifference(b) - goalDifference(a))[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="League table"
        title="Standings"
        description="Sorted by points, head-to-head points, head-to-head away goals, goal difference, goals scored, then alphabetical order."
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Leader" value={leader?.player?.name ?? "-"} detail={leader ? `${leader.pts} pts` : "No leader yet"} />
        <MetricCard label="Best Attack" value={bestAttack?.player?.name ?? "-"} detail={bestAttack ? `${bestAttack.gf} goals` : ""} />
        <MetricCard label="Best Defence" value={bestDefense?.player?.name ?? "-"} detail={bestDefense ? `${bestDefense.ga} conceded` : ""} />
        <MetricCard label="Best GD" value={bestGd?.player?.name ?? "-"} detail={bestGd ? `${goalDifference(bestGd)} goal difference` : ""} />
      </section>
      <StandingsTable standings={sortedStandings} fixtures={fixtures} />
    </div>
  );
}
