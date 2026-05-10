import { Crown } from "lucide-react";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Badge } from "@/components/ui/badge";
import { getForm } from "@/lib/standings";
import { cn, goalDifference } from "@/lib/utils";
import type { Fixture, Standing } from "@/types";

type Props = {
  standings: Standing[];
  fixtures: Fixture[];
  limit?: number;
};

export function StandingsTable({ standings, fixtures, limit }: Props) {
  const rows = typeof limit === "number" ? standings.slice(0, limit) : standings;

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full border-collapse text-left">
        <thead className="bg-white/[0.05]">
          <tr className="font-label text-sm uppercase tracking-wide text-muted">
            <th className="px-3 py-3 sm:px-4">Pos</th>
            <th className="px-3 py-3 sm:px-4">Player</th>
            <th className="hidden px-3 py-3 text-center sm:table-cell">MP</th>
            <th className="px-3 py-3 text-center">W</th>
            <th className="hidden px-3 py-3 text-center sm:table-cell">D</th>
            <th className="px-3 py-3 text-center">L</th>
            <th className="hidden px-3 py-3 text-center sm:table-cell">GF</th>
            <th className="hidden px-3 py-3 text-center sm:table-cell">GA</th>
            <th className="px-3 py-3 text-center">GD</th>
            <th className="hidden px-3 py-3 text-center sm:table-cell">Bonus</th>
            <th className="hidden px-3 py-3 text-center md:table-cell">Form</th>
            <th className="px-3 py-3 text-right sm:px-4">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((standing, index) => {
            const player = standing.player;
            if (!player) return null;
            const position = index + 1;
            const form = getForm(fixtures, standing.player_id);

            return (
              <tr
                key={standing.player_id}
                className={cn(
                  "border-t border-white/10 text-sm",
                  position === 1 && "bg-gold/[0.06]",
                  position === 2 && "bg-slate-300/[0.04]",
                  position === 3 && "bg-orange-400/[0.04]",
                  position === standings.length && "bg-red-500/[0.04]"
                )}
              >
                <td className="px-3 py-3 sm:px-4">
                  <Badge
                    variant={
                      position === 1 ? "gold" : position === standings.length ? "red" : "default"
                    }
                  >
                    {position}
                  </Badge>
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <div className="flex items-center gap-3">
                    <AvatarCircle player={player} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-semibold text-white">
                        <span className="truncate">{player.name}</span>
                        {position === 1 ? <Crown className="h-4 w-4 shrink-0 animate-glowPulse text-gold" /> : null}
                      </div>
                      <div className="truncate text-xs text-muted">@{player.psn_tag}</div>
                    </div>
                  </div>
                </td>
                <td className="hidden px-3 py-3 text-center sm:table-cell">{standing.mp}</td>
                <td className="px-3 py-3 text-center">{standing.wins}</td>
                <td className="hidden px-3 py-3 text-center sm:table-cell">{standing.draws}</td>
                <td className="px-3 py-3 text-center">{standing.losses}</td>
                <td className="hidden px-3 py-3 text-center sm:table-cell">{standing.gf}</td>
                <td className="hidden px-3 py-3 text-center sm:table-cell">{standing.ga}</td>
                <td className="px-3 py-3 text-center">{goalDifference(standing)}</td>
                <td className="hidden px-3 py-3 text-center text-pitch sm:table-cell">{standing.bonus_pts}</td>
                <td className="hidden px-3 py-3 md:table-cell">
                  <div className="flex justify-center gap-1">
                    {form.length ? (
                      form.map((result, resultIndex) => (
                        <span
                          key={`${standing.player_id}-${resultIndex}`}
                          className={cn(
                            "grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold",
                            result === "W" && "bg-pitch text-[#031008]",
                            result === "D" && "bg-white/14 text-white",
                            result === "L" && "bg-red-500/70 text-white"
                          )}
                        >
                          {result}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-display text-3xl leading-none text-white sm:px-4">
                  {standing.pts}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
