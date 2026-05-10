import { Plus, UserCheck } from "lucide-react";
import { claimPlayerAction, selfRegisterPlayerAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import type { Player } from "@/types";

type Props = {
  unclaimedPlayers: Player[];
  canSelfRegister: boolean;
  fixturesGenerated: boolean;
  squadFull: boolean;
};

export function ClaimPlayerForm({ unclaimedPlayers, canSelfRegister, fixturesGenerated, squadFull }: Props) {
  const hasUnclaimed = unclaimedPlayers.length > 0;
  const lockedReason = squadFull
    ? "The squad is full — no room to add yourself."
    : fixturesGenerated
      ? "Fixtures are already generated. Ask the admin to add you."
      : null;

  return (
    <div className="space-y-4">
      {hasUnclaimed ? (
        <Card>
          <CardHeader>
            <CardTitle>Claim Your Squad Name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted">
              Pick the squad name that&apos;s yours. Once claimed, only you can submit your scores.
            </p>
            <form action={claimPlayerAction} className="space-y-3">
              <div>
                <Label htmlFor="claim-player">Squad name</Label>
                <Select id="claim-player" name="player_id" required defaultValue="">
                  <option value="" disabled>
                    Pick yours
                  </option>
                  {unclaimedPlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} (@{player.psn_tag})
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" className="w-full">
                <UserCheck className="h-4 w-4" />
                Claim
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{hasUnclaimed ? "Don't See Your Name?" : "Add Your Squad Name"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canSelfRegister ? (
            <>
              <p className="text-sm text-muted">
                {hasUnclaimed
                  ? "Add yourself to the squad — your account will be linked automatically."
                  : "Every existing squad name is already claimed. Add yourself below to join the squad."}
              </p>
              <form action={selfRegisterPlayerAction} className="space-y-3">
                <div>
                  <Label htmlFor="self-register-name">Name</Label>
                  <Input id="self-register-name" name="name" placeholder="Marcus" required />
                </div>
                <div>
                  <Label htmlFor="self-register-psn">PSN tag</Label>
                  <Input id="self-register-psn" name="psn_tag" placeholder="marcus_fc25" required />
                </div>
                <Button type="submit" variant="secondary" className="w-full">
                  <Plus className="h-4 w-4" />
                  Add Me to the Squad
                </Button>
              </form>
            </>
          ) : (
            <p className="text-sm text-muted">
              {lockedReason ?? "Ask the admin to release a squad name for you."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
