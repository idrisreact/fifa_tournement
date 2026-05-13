import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Table2, Users, BarChart3, ShieldCheck } from "lucide-react";
import { getCurrentPlayer, getCurrentUser, isAdminUser } from "@/lib/auth";
import { getTournamentData } from "@/lib/data";
import { sortStandings } from "@/lib/standings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FixtureCard } from "@/components/FixtureCard";
import { MetricCard } from "@/components/MetricCard";
import { MyDashboard } from "@/components/MyDashboard";
import { SignInWithGoogleButton } from "@/components/SignInWithGoogleButton";
import { StandingsTable } from "@/components/StandingsTable";
import { StatusChip } from "@/components/StatusChip";

export default async function DashboardPage() {
  const [{ season, players, fixtures, standings, predictions, usingDemoData }, isAdmin, currentPlayer, currentUser] = await Promise.all([
    getTournamentData(),
    isAdminUser(),
    getCurrentPlayer(),
    getCurrentUser()
  ]);
  const played = fixtures.filter(
    (fixture) =>
      fixture.played &&
      !fixture.voided &&
      fixture.home_score !== null &&
      fixture.away_score !== null
  );
  const totalGoals = played.reduce(
    (total, fixture) => total + (fixture.home_score ?? 0) + (fixture.away_score ?? 0),
    0
  );
  const sortedStandings = standings.length ? sortStandings(standings, fixtures) : [];
  const leader = sortedStandings[0];
  const recentResults = played
    .sort((a, b) => new Date(b.played_at ?? 0).getTime() - new Date(a.played_at ?? 0).getTime())
    .slice(0, 5);

  const navLinks = [
    { href: "/squad", label: "Squad", icon: Users },
    { href: "/fixtures", label: "Fixtures", icon: CalendarDays },
    { href: "/standings", label: "Standings", icon: Table2 },
    { href: "/stats", label: "Stats", icon: BarChart3 },
    { href: "/rules", label: "Rules", icon: ShieldCheck }
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-lg border border-white/10 bg-[#09131e] p-6 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <Image
            src="/idris_boss.png"
            alt=""
            aria-hidden
            fill
            quality={65}
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover object-right opacity-90 [mask-image:linear-gradient(to_left,black_55%,transparent)]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(0,200,83,0.12))]" />
        </div>
        <div className="relative max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <StatusChip status={season.status} />
            {usingDemoData ? (
              <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-label text-sm uppercase tracking-wide text-gold">
                Supabase required
              </span>
            ) : null}
          </div>
          <h1 className="font-display text-5xl uppercase leading-none text-white sm:text-7xl lg:text-8xl">
            {season.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            {usingDemoData
              ? "Connect Supabase to start taking real signups, generating fixtures, and logging results."
              : `${played.length} of ${fixtures.length || season.max_players * (season.max_players - 1)} matches played. Every result, bonus point, and head-to-head swing tracked live.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/fixtures">
                View Fixtures
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/standings">League Table</Link>
            </Button>
            {!currentUser && !usingDemoData ? (
              <SignInWithGoogleButton variant="gold" />
            ) : null}
          </div>
        </div>
      </section>

      {currentPlayer ? (
        <MyDashboard
          currentPlayer={currentPlayer}
          players={players}
          fixtures={fixtures}
          sortedStandings={sortedStandings}
          predictions={predictions}
        />
      ) : null}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Goals" value={totalGoals} detail={`${played.length} matches logged`} />
        <MetricCard label="Matches Played" value={played.length} detail={`${fixtures.length - played.length} remaining`} />
        <MetricCard
          label="Current Leader"
          value={leader?.player?.name ?? "-"}
          detail={leader ? `${leader.pts} points` : "No table yet"}
        />
        <MetricCard label="Matches Remaining" value={Math.max(fixtures.length - played.length, 0)} detail="Road to the title" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Top Five</CardTitle>
          </CardHeader>
          <CardContent>
            <StandingsTable standings={sortedStandings} fixtures={fixtures} limit={5} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentResults.length ? (
              recentResults.map((fixture) => (
                <FixtureCard key={fixture.id} fixture={fixture} players={players} compact usingDemoData={usingDemoData} isAdmin={isAdmin} currentPlayerId={currentPlayer?.id ?? null} />
              ))
            ) : (
              <p className="text-sm text-muted">No results logged yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between rounded-lg border border-white/10 bg-panel p-4 transition hover:border-pitch/40 hover:bg-panel2"
            >
              <span className="flex items-center gap-3 font-label text-lg uppercase text-white">
                <Icon className="h-5 w-5 text-pitch" />
                {link.label}
              </span>
              <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-1 group-hover:text-pitch" />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
