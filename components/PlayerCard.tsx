import { Trash2 } from "lucide-react";
import { removePlayerAction } from "@/app/actions";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Player } from "@/types";

type Props = {
  player: Player;
  index: number;
  canRemove: boolean;
  usingDemoData?: boolean;
};

export function PlayerCard({ player, index, canRemove, usingDemoData }: Props) {
  return (
    <Card className="animate-fadeUp p-4">
      <div className="flex items-center gap-4">
        <AvatarCircle player={player} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl uppercase leading-none text-white">{player.name}</p>
          <p className="truncate text-sm text-muted">@{player.psn_tag}</p>
        </div>
        <span className="font-display text-4xl leading-none text-white/12">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      {canRemove ? (
        <form action={removePlayerAction} className="mt-4">
          <input type="hidden" name="player_id" value={player.id} />
          <Button variant="danger" size="sm" disabled={usingDemoData} className="w-full">
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
