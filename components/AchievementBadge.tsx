import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Award } from "@/lib/badges";

type Props = {
  award: Award;
  showWinners?: boolean;
  highlightPlayerId?: string | null;
};

const toneStyles: Record<Award["tone"], { ring: string; icon: string; chip: string }> = {
  gold: {
    ring: "border-gold/35 bg-gold/8",
    icon: "bg-gold/15 text-gold",
    chip: "border-gold/35 bg-gold/10 text-gold"
  },
  green: {
    ring: "border-pitch/35 bg-pitch/8",
    icon: "bg-pitch/15 text-pitch",
    chip: "border-pitch/35 bg-pitch/10 text-pitch"
  },
  blue: {
    ring: "border-sky-400/35 bg-sky-400/8",
    icon: "bg-sky-400/15 text-sky-200",
    chip: "border-sky-400/35 bg-sky-400/10 text-sky-200"
  },
  red: {
    ring: "border-red-400/35 bg-red-500/8",
    icon: "bg-red-500/15 text-red-200",
    chip: "border-red-400/35 bg-red-500/10 text-red-200"
  }
};

export function AchievementBadge({ award, showWinners = true, highlightPlayerId }: Props) {
  const Icon = award.icon;
  const tone = toneStyles[award.tone];
  const unclaimed = award.winners.length === 0;
  const headlineValue = award.winners[0]?.value;

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-3 rounded-lg border p-4",
        unclaimed ? "border-white/10 bg-white/[0.03]" : tone.ring
      )}
    >
      <header className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-md",
            unclaimed ? "bg-white/[0.05] text-muted" : tone.icon
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg uppercase leading-tight text-white">{award.name}</h3>
          <p className="text-xs text-muted">{award.description}</p>
        </div>
        {!unclaimed && headlineValue !== undefined ? (
          <span
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 font-label text-xs uppercase tracking-wide",
              tone.chip
            )}
          >
            {headlineValue} {award.unit}
          </span>
        ) : null}
      </header>

      {unclaimed ? (
        <p className="mt-auto text-xs text-muted">Unclaimed — be the first to earn this.</p>
      ) : showWinners ? (
        <ul className="mt-auto space-y-1 text-sm">
          {award.winners.map((winner) => {
            const isHighlighted = highlightPlayerId === winner.playerId;
            return (
              <li
                key={winner.playerId}
                className={cn(
                  "flex items-center justify-between gap-3",
                  isHighlighted && "rounded-md bg-white/[0.05] px-2 py-1"
                )}
              >
                <Link
                  href={`/players/${winner.playerId}`}
                  className="truncate font-label uppercase tracking-wide text-white transition hover:text-pitch"
                >
                  {winner.player?.name ?? "Player"}
                </Link>
                {winner.detail ? (
                  <span className="shrink-0 text-xs text-muted">{winner.detail}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}
