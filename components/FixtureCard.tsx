import { Camera, Flag, RotateCcw } from "lucide-react";
import { AvatarCircle } from "@/components/AvatarCircle";
import { LogResultModal } from "@/components/LogResultModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Fixture, Player } from "@/types";

type Props = {
  fixture: Fixture;
  players: Player[];
  compact?: boolean;
  usingDemoData?: boolean;
};

export function FixtureCard({ fixture, players, compact, usingDemoData }: Props) {
  const home = fixture.home_player;
  const away = fixture.away_player;
  if (!home || !away) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1420] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Badge>MD {fixture.matchday}</Badge>
        <Badge variant={fixture.leg === 1 ? "green" : "gold"}>Leg {fixture.leg}</Badge>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarCircle player={home} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-label text-lg uppercase text-white">{home.name}</p>
            {!compact ? <p className="truncate text-xs text-muted">@{home.psn_tag}</p> : null}
          </div>
        </div>
        <div className="min-w-24 text-center">
          {fixture.played ? (
            <div className="font-display text-4xl leading-none text-white">
              {fixture.home_score} - {fixture.away_score}
            </div>
          ) : (
            <LogResultModal fixture={fixture} players={players} disabled={usingDemoData}>
              <Button size="sm" variant="secondary">
                Log Result
              </Button>
            </LogResultModal>
          )}
        </div>
        <div className="flex min-w-0 items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <p className="truncate font-label text-lg uppercase text-white">{away.name}</p>
            {!compact ? <p className="truncate text-xs text-muted">@{away.psn_tag}</p> : null}
          </div>
          <AvatarCircle player={away} size="sm" />
        </div>
      </div>
      {fixture.played && (fixture.rage_quit_player_id || fixture.comeback_win || fixture.result_screenshot_url) ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          {fixture.rage_quit_player_id ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/12 px-2 py-1 text-red-200">
              <Flag className="h-3 w-3" />
              Rage quit
            </span>
          ) : null}
          {fixture.comeback_win ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-pitch/10 px-2 py-1 text-pitch">
              <RotateCcw className="h-3 w-3" />
              Comeback
            </span>
          ) : null}
          {fixture.result_screenshot_url ? (
            <a
              href={fixture.result_screenshot_url}
              className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-1 text-white hover:bg-white/12"
              target="_blank"
            >
              <Camera className="h-3 w-3" />
              Screenshot
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
