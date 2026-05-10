import { AlertTriangle, Link2Off, LogOut, RotateCcw, Save, Shield, Trophy } from "lucide-react";
import {
  clearSubmissionsAction,
  logResultAction,
  manualPointsAction,
  releasePlayerLinkAction,
  resetFixtureAction,
  signInWithGoogle,
  signOut,
  updateSeasonStatusAction
} from "@/app/actions";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { getTournamentData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";

export default async function AdminPage() {
  const [{ season, players, fixtures, standings, usingDemoData }, isAdmin, currentUser] =
    await Promise.all([getTournamentData(), isAdminUser(), getCurrentUser()]);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader
          eyebrow={currentUser ? "Signed in" : "Sign in"}
          title={currentUser ? "Not authorized" : "Sign in"}
          description={
            currentUser
              ? "You're signed in, but this account does not have admin access. Players: head to Squad to claim your name."
              : "Sign in to claim your squad name and submit your match results. Only the admin account unlocks tournament management."
          }
        />
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>{currentUser ? "Account" : "Sign In"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentUser ? (
              <>
                <p className="text-sm text-muted">
                  Signed in as <span className="text-white">{currentUser.email}</span>.
                </p>
                <form action={signOut}>
                  <Button type="submit" variant="secondary" className="w-full">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </form>
              </>
            ) : (
              <form action={signInWithGoogle}>
                <Button type="submit" className="w-full">
                  Sign in with Google
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const playedFixtures = fixtures.filter((fixture) => fixture.played);
  const disputedFixtures = fixtures.filter((fixture) => fixture.dispute_open);
  const linkedPlayers = players.filter((player) => player.auth_user_id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control room"
        title="Admin"
        description="Override results, reset fixtures, manage point adjustments, and change season status."
        action={
          currentUser ? (
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

      {disputedFixtures.length ? (
        <Card className="border-red-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-300" />
              Disputed Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {disputedFixtures.map((fixture) => (
              <div
                key={fixture.id}
                className="rounded-lg border border-red-400/20 bg-red-500/[0.06] p-4"
              >
                <p className="font-label text-lg uppercase text-white">
                  MD {fixture.matchday} Leg {fixture.leg}: {fixture.home_player?.name} vs {fixture.away_player?.name}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-white/[0.04] p-2">
                    <p className="text-xs uppercase text-muted">{fixture.home_player?.name} submitted</p>
                    <p className="font-display text-2xl text-white">
                      {fixture.home_submitted_home_score} - {fixture.home_submitted_away_score}
                    </p>
                  </div>
                  <div className="rounded-md bg-white/[0.04] p-2">
                    <p className="text-xs uppercase text-muted">{fixture.away_player?.name} submitted</p>
                    <p className="font-display text-2xl text-white">
                      {fixture.away_submitted_home_score} - {fixture.away_submitted_away_score}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={clearSubmissionsAction}>
                    <input type="hidden" name="fixture_id" value={fixture.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      <RotateCcw className="h-4 w-4" />
                      Clear & let players resubmit
                    </Button>
                  </form>
                  <p className="text-xs text-muted">
                    Or scroll to <strong>Override Result</strong> below to set the final score yourself.
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {linkedPlayers.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Linked Accounts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {linkedPlayers.map((player) => (
              <form
                key={player.id}
                action={releasePlayerLinkAction}
                className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-[#0b1420] p-3"
              >
                <input type="hidden" name="player_id" value={player.id} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{player.name}</p>
                  <p className="truncate text-xs text-muted">@{player.psn_tag}</p>
                </div>
                <Button type="submit" variant="ghost" size="sm">
                  <Link2Off className="h-4 w-4" />
                  Unlink
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      ) : null}

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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
