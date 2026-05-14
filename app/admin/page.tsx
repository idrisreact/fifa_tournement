import { AlertTriangle, Link2Off, LogOut, RotateCcw, Trophy, Users } from "lucide-react";
import {
  clearSubmissionsAction,
  releasePlayerLinkAction,
  resetFixtureAction,
  signInWithGoogle,
  signOut,
  updateSeasonMaxPlayersAction,
  updateSeasonStatusAction
} from "@/app/actions";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { getTournamentData } from "@/lib/data";
import { AdminActionForm } from "@/components/AdminActionForm";
import { AdminOverrideResults } from "@/components/AdminOverrideResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { ManualPointsForm } from "@/components/ManualPointsForm";
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
            <AdminActionForm
              action={updateSeasonStatusAction}
              successMessage="Season status updated"
              className="grid gap-3 sm:grid-cols-[1fr_auto]"
            >
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
            </AdminActionForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Squad Size</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminActionForm
              action={updateSeasonMaxPlayersAction}
              successMessage="Squad size updated"
              className="space-y-3"
            >
              <input type="hidden" name="season_id" value={season.id} />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <Label htmlFor="max_players">Max players (2-20)</Label>
                  <Input
                    id="max_players"
                    name="max_players"
                    type="number"
                    min={Math.max(2, players.length)}
                    max={20}
                    defaultValue={season.max_players}
                    disabled={usingDemoData || fixtures.length > 0}
                  />
                </div>
                <Button type="submit" disabled={usingDemoData || fixtures.length > 0}>
                  <Users className="h-4 w-4" />
                  Update
                </Button>
              </div>
              <p className="text-xs text-muted">
                {fixtures.length > 0
                  ? "Fixtures have been generated. Reset fixtures before changing squad size."
                  : `Currently ${players.length} of ${season.max_players} slots filled. Generating ${season.max_players} players produces ${season.max_players * (season.max_players - 1)} fixtures.`}
              </p>
            </AdminActionForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ManualPointsForm
              seasonId={season.id}
              standings={standings}
              disabled={usingDemoData}
            />
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
                  <AdminActionForm
                    action={clearSubmissionsAction}
                    successMessage="Submissions cleared"
                  >
                    <input type="hidden" name="fixture_id" value={fixture.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      <RotateCcw className="h-4 w-4" />
                      Clear & let players resubmit
                    </Button>
                  </AdminActionForm>
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
              <AdminActionForm
                key={player.id}
                action={releasePlayerLinkAction}
                successMessage="Account unlinked"
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
              </AdminActionForm>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <AdminOverrideResults fixtures={fixtures} players={players} usingDemoData={usingDemoData} />

      <Card>
        <CardHeader>
          <CardTitle>Reset Played Fixtures</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {playedFixtures.length ? (
            playedFixtures.map((fixture) => (
              <AdminActionForm
                key={fixture.id}
                action={resetFixtureAction}
                successMessage="Fixture reset"
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
              </AdminActionForm>
            ))
          ) : (
            <p className="text-sm text-muted">No played fixtures yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
