import { Plus, Shuffle } from "lucide-react";
import { addPlayerAction, generateFixturesAction } from "@/app/actions";
import { getCurrentPlayer, getCurrentUser, isAdminUser } from "@/lib/auth";
import { getTournamentData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { ClaimPlayerForm } from "@/components/ClaimPlayerForm";
import { PageHeader } from "@/components/PageHeader";
import { PlayerCard } from "@/components/PlayerCard";
import { ResetFixturesButton } from "@/components/ResetFixturesButton";
import { SignInWithGoogleButton } from "@/components/SignInWithGoogleButton";

export default async function SquadPage() {
  const [{ season, players, fixtures, usingDemoData }, isAdmin, currentUser, currentPlayer] =
    await Promise.all([getTournamentData(), isAdminUser(), getCurrentUser(), getCurrentPlayer()]);

  const fixtureCount = fixtures.length;
  const canHardRemove = fixtureCount === 0;
  const canGenerate = season.status === "setup" && players.length >= 2 && fixtureCount === 0 && !usingDemoData;
  const showClaimForm = !!currentUser && !currentPlayer;
  const showSignInCard = !currentUser && !usingDemoData;
  const unclaimedPlayers = players.filter((player) => !player.auth_user_id && player.is_active !== false);
  const maxPlayers = season.max_players ?? 12;
  const squadFull = players.length >= maxPlayers;
  const fixturesGenerated = fixtureCount > 0;
  const canSelfRegister = !squadFull && !fixturesGenerated && !usingDemoData;
  const showSidebar = isAdmin || showClaimForm || showSignInCard;

  return (
    <div>
      <PageHeader
        eyebrow="Player management"
        title="Squad"
        description="Register the group, assign colours, then generate the full home-and-away calendar."
        action={
          <div className="rounded-lg border border-white/10 bg-panel px-4 py-3 text-right">
            <p className="font-label text-sm uppercase tracking-wide text-muted">Players</p>
            <p className="font-display text-4xl leading-none text-white">{players.length} / {maxPlayers}</p>
          </div>
        }
      />

      <div className={showSidebar ? "grid gap-6 lg:grid-cols-[0.85fr_1.4fr] lg:items-start" : "space-y-6"}>
        {showSidebar ? (
          <div className="space-y-6">
            {showSignInCard ? (
              <Card>
                <CardHeader>
                  <CardTitle>Join the Squad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted">
                    Sign in to claim your squad name or add yourself to the roster. Once linked, only you can submit your match results.
                  </p>
                  <SignInWithGoogleButton className="w-full [&>button]:w-full" />
                </CardContent>
              </Card>
            ) : null}
            {showClaimForm ? (
              <ClaimPlayerForm
                unclaimedPlayers={unclaimedPlayers}
                canSelfRegister={canSelfRegister}
                fixturesGenerated={fixturesGenerated}
                squadFull={squadFull}
              />
            ) : null}
            {isAdmin ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Add Player</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form action={addPlayerAction} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="Marcus" required disabled={squadFull || usingDemoData} />
                      </div>
                      <div>
                        <Label htmlFor="psn_tag">PSN Tag</Label>
                        <Input id="psn_tag" name="psn_tag" placeholder="marcus_fc25" required disabled={squadFull || usingDemoData} />
                      </div>
                      <Button type="submit" className="w-full" disabled={squadFull || usingDemoData}>
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
                      <div className="mt-3 space-y-3">
                        <p className="text-sm text-muted">
                          {fixtureCount} fixtures already generated. Reset them to add new players or regenerate the schedule.
                        </p>
                        <ResetFixturesButton
                          seasonId={season.id}
                          fixtureCount={fixtureCount}
                          disabled={usingDemoData}
                        />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {players.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              index={index}
              canHardRemove={canHardRemove}
              usingDemoData={usingDemoData}
              isAdmin={isAdmin}
              isCurrentPlayer={player.id === currentPlayer?.id}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
