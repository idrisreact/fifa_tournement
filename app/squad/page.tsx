import { Plus, Shuffle } from "lucide-react";
import { addPlayerAction, generateFixturesAction } from "@/app/actions";
import { getTournamentData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { PlayerCard } from "@/components/PlayerCard";

export default async function SquadPage() {
  const { season, players, fixtures, usingDemoData } = await getTournamentData();
  const fixtureCount = fixtures.length;
  const canRemove = fixtureCount === 0;
  const canGenerate = season.status === "setup" && players.length >= 2 && fixtureCount === 0 && !usingDemoData;

  return (
    <div>
      <PageHeader
        eyebrow="Player management"
        title="Squad"
        description="Register the group, assign colours, then generate the full home-and-away calendar."
        action={
          <div className="rounded-lg border border-white/10 bg-panel px-4 py-3 text-right">
            <p className="font-label text-sm uppercase tracking-wide text-muted">Players</p>
            <p className="font-display text-4xl leading-none text-white">{players.length} / 12</p>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.4fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Player</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addPlayerAction} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Marcus" required disabled={players.length >= 12 || usingDemoData} />
                </div>
                <div>
                  <Label htmlFor="psn_tag">PSN Tag</Label>
                  <Input id="psn_tag" name="psn_tag" placeholder="marcus_fc25" required disabled={players.length >= 12 || usingDemoData} />
                </div>
                <Button type="submit" className="w-full" disabled={players.length >= 12 || usingDemoData}>
                  <Plus className="h-4 w-4" />
                  Add Player
                </Button>
              </form>
              {usingDemoData ? (
                <p className="mt-3 text-sm text-gold">Connect Supabase env vars to manage the real squad.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fixtures</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted">
                Generates the Berger double round-robin: {players.length ? players.length * (players.length - 1) : 0} matches.
              </p>
              <form action={generateFixturesAction}>
                <input type="hidden" name="season_id" value={season.id} />
                <Button type="submit" variant="gold" className="w-full" disabled={!canGenerate}>
                  <Shuffle className="h-4 w-4" />
                  Generate Fixtures
                </Button>
              </form>
              {fixtureCount > 0 ? (
                <p className="mt-3 text-sm text-muted">{fixtureCount} fixtures already generated.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {players.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              index={index}
              canRemove={canRemove}
              usingDemoData={usingDemoData}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
