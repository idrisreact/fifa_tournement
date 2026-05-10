import { Lock, LogOut, RotateCcw, Save, Shield, Trophy } from "lucide-react";
import {
  logResultAction,
  manualPointsAction,
  resetFixtureAction,
  signInWithGoogle,
  signInWithMagicLink,
  signOut,
  updateSeasonStatusAction
} from "@/app/actions";
import { getTournamentData } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";

export default async function AdminPage() {
  const { season, players, fixtures, standings, usingDemoData } = await getTournamentData();
  const supabase = createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = !hasSupabaseEnv() || !adminEmail || data.user?.email === adminEmail;

  if (!isAdmin) {
    return (
      <div>
        <PageHeader
          eyebrow="Protected route"
          title="Admin"
          description="Sign in with the designated admin account to manage official results."
        />
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Admin Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={signInWithMagicLink} className="space-y-3">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
              <Button type="submit" className="w-full">
                <Lock className="h-4 w-4" />
                Send Magic Link
              </Button>
            </form>
            <form action={signInWithGoogle}>
              <Button type="submit" variant="secondary" className="w-full">
                Sign in with Google
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const playedFixtures = fixtures.filter((fixture) => fixture.played);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control room"
        title="Admin"
        description="Override results, reset fixtures, manage point adjustments, and change season status."
        action={
          data.user ? (
            <form action={signOut}>
              <Button type="submit" variant="secondary">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          ) : null
        }
      />

      {usingDemoData ? (
        <Card className="border-gold/30 bg-gold/10 p-4 text-gold">
          Supabase is not configured, so admin actions are disabled until the production database is connected.
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Season Status</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateSeasonStatusAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input type="hidden" name="season_id" value={season.id} />
              <Select name="status" defaultValue={season.status} disabled={usingDemoData}>
                <option value="setup">Setup</option>
                <option value="active">Active</option>
                <option value="complete">Complete</option>
              </Select>
              <Button type="submit" disabled={usingDemoData}>
                <Trophy className="h-4 w-4" />
                Update
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Points</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={manualPointsAction} className="space-y-3">
              <input type="hidden" name="season_id" value={season.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Player</Label>
                  <Select name="player_id" disabled={usingDemoData}>
                    {standings.map((standing) => (
                      <option key={standing.player_id} value={standing.player_id}>
                        {standing.player?.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Points</Label>
                  <Input name="points" type="number" defaultValue="1" disabled={usingDemoData} />
                </div>
              </div>
              <div>
                <Label>Reason note</Label>
                <Textarea name="reason" placeholder="Admin correction note" disabled={usingDemoData} />
              </div>
              <Button type="submit" disabled={usingDemoData}>
                <Shield className="h-4 w-4" />
                Apply Adjustment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Override Result</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-2">
            {fixtures.slice(0, 24).map((fixture) => (
              <form
                key={fixture.id}
                action={logResultAction}
                className="rounded-lg border border-white/10 bg-[#0b1420] p-4"
              >
                <input type="hidden" name="fixture_id" value={fixture.id} />
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-label text-lg uppercase text-white">
                    MD {fixture.matchday}: {fixture.home_player?.name} vs {fixture.away_player?.name}
                  </p>
                  <span className="text-xs text-muted">Leg {fixture.leg}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <Label>Home</Label>
                    <Input name="home_score" type="number" min="0" defaultValue={fixture.home_score ?? 0} disabled={usingDemoData} />
                  </div>
                  <div>
                    <Label>Away</Label>
                    <Input name="away_score" type="number" min="0" defaultValue={fixture.away_score ?? 0} disabled={usingDemoData} />
                  </div>
                  <div>
                    <Label>Rage Quit</Label>
                    <Select name="rage_quit_player_id" defaultValue={fixture.rage_quit_player_id ?? ""} disabled={usingDemoData}>
                      <option value="">None</option>
                      <option value={fixture.home_player_id}>{fixture.home_player?.name}</option>
                      <option value={fixture.away_player_id}>{fixture.away_player?.name}</option>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full" disabled={usingDemoData}>
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <input
                    name="comeback_win"
                    type="checkbox"
                    defaultChecked={fixture.comeback_win}
                    className="h-4 w-4 accent-pitch"
                    disabled={usingDemoData}
                  />
                  Comeback win
                </label>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Played Fixtures</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {playedFixtures.length ? (
            playedFixtures.map((fixture) => (
              <form
                key={fixture.id}
                action={resetFixtureAction}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0b1420] p-3"
              >
                <input type="hidden" name="fixture_id" value={fixture.id} />
                <div>
                  <p className="font-semibold text-white">
                    {fixture.home_player?.name} {fixture.home_score}-{fixture.away_score} {fixture.away_player?.name}
                  </p>
                  <p className="text-xs text-muted">Matchday {fixture.matchday}</p>
                </div>
                <Button type="submit" variant="danger" size="sm" disabled={usingDemoData}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </form>
            ))
          ) : (
            <p className="text-sm text-muted">No played fixtures yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
