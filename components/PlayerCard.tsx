import { RotateCcw, Trash2, UserMinus } from "lucide-react";
import { reinstatePlayerAction, removePlayerAction, withdrawPlayerAction } from "@/app/actions";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Player } from "@/types";

type Props = {
  player: Player;
  index: number;
  canHardRemove: boolean;
  usingDemoData?: boolean;
  isAdmin?: boolean;
  isCurrentPlayer?: boolean;
};

export function PlayerCard({ player, index, canHardRemove, usingDemoData, isAdmin, isCurrentPlayer }: Props) {
  const withdrawn = player.is_active === false;

  return (
    <Card className={`animate-fadeUp p-4 ${withdrawn ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-4">
        <AvatarCircle player={player} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-3xl uppercase leading-none text-white">{player.name}</p>
            {isCurrentPlayer ? (
              <span className="rounded-full border border-pitch/40 bg-pitch/15 px-2 py-0.5 font-label text-[10px] uppercase tracking-wide text-pitch">
                You
              </span>
            ) : null}
            {withdrawn ? (
              <span className="rounded-full border border-red-400/40 bg-red-500/15 px-2 py-0.5 font-label text-[10px] uppercase tracking-wide text-red-200">
                Withdrawn
              </span>
            ) : null}
          </div>
          <p className="truncate text-sm text-muted">@{player.psn_tag}</p>
        </div>
        <span className="font-display text-4xl leading-none text-white/12">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {isAdmin && !usingDemoData ? (
        <div className="mt-4">
          {canHardRemove && !withdrawn ? (
            <form action={removePlayerAction}>
              <input type="hidden" name="player_id" value={player.id} />
              <Button variant="danger" size="sm" className="w-full">
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </form>
          ) : withdrawn ? (
            <form action={reinstatePlayerAction}>
              <input type="hidden" name="player_id" value={player.id} />
              <Button variant="secondary" size="sm" className="w-full">
                <RotateCcw className="h-4 w-4" />
                Reinstate
              </Button>
            </form>
          ) : (
            <form action={withdrawPlayerAction}>
              <input type="hidden" name="player_id" value={player.id} />
              <Button variant="danger" size="sm" className="w-full">
                <UserMinus className="h-4 w-4" />
                Withdraw
              </Button>
            </form>
          )}
        </div>
      ) : null}
    </Card>
  );
}
