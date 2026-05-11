import { AlertTriangle, Camera, Clock, Flag, RotateCcw } from "lucide-react";
import Link from "next/link";
import { AvatarCircle } from "@/components/AvatarCircle";
import { FixtureSocialPanel } from "@/components/FixtureSocialPanel";
import { LogResultModal } from "@/components/LogResultModal";
import { SubmitResultModal } from "@/components/SubmitResultModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Fixture, FixtureComment, FixtureReaction, Player, Prediction } from "@/types";

type Props = {
  fixture: Fixture;
  players: Player[];
  compact?: boolean;
  usingDemoData?: boolean;
  isAdmin?: boolean;
  currentPlayerId?: string | null;
  comments?: FixtureComment[];
  reactions?: FixtureReaction[];
  predictions?: Prediction[];
};

type ScoreSlotProps = {
  fixture: Fixture;
  players: Player[];
  isAdmin: boolean;
  usingDemoData?: boolean;
  role: "home" | "away" | null;
};

function ScoreSlot({ fixture, players, isAdmin, usingDemoData, role }: ScoreSlotProps) {
  if (fixture.played) {
    return (
      <div className="font-display text-3xl leading-none text-white sm:text-4xl">
        {fixture.home_score} - {fixture.away_score}
      </div>
    );
  }

  if (fixture.voided) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-1 font-label text-xs uppercase tracking-wide text-muted">
        Voided
      </span>
    );
  }

  if (fixture.dispute_open) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/12 px-2 py-1 font-label text-xs uppercase tracking-wide text-red-200">
        <AlertTriangle className="h-3 w-3" />
        Disputed
      </span>
    );
  }

  const mySubmittedAt = role === "home" ? fixture.home_submitted_at : role === "away" ? fixture.away_submitted_at : null;
  const theirSubmittedAt = role === "home" ? fixture.away_submitted_at : role === "away" ? fixture.home_submitted_at : null;

  if (role && mySubmittedAt) {
    const myHome = role === "home" ? fixture.home_submitted_home_score : fixture.away_submitted_home_score;
    const myAway = role === "home" ? fixture.home_submitted_away_score : fixture.away_submitted_away_score;
    return (
      <div className="space-y-1">
        <div className="font-display text-2xl leading-none text-muted sm:text-3xl">
          {myHome} - {myAway}
        </div>
        <span className="inline-flex items-center gap-1 font-label text-[10px] uppercase tracking-wide text-muted">
          <Clock className="h-3 w-3" />
          Awaiting opponent
        </span>
      </div>
    );
  }

  if (role && theirSubmittedAt) {
    return (
      <SubmitResultModal fixture={fixture} players={players}>
        <Button size="sm" variant="gold">
          Confirm Score
        </Button>
      </SubmitResultModal>
    );
  }

  if (role) {
    return (
      <SubmitResultModal fixture={fixture} players={players}>
        <Button size="sm" variant="secondary">
          Submit Result
        </Button>
      </SubmitResultModal>
    );
  }

  if (isAdmin) {
    return (
      <LogResultModal fixture={fixture} players={players} disabled={usingDemoData}>
        <Button size="sm" variant="secondary">
          Log Result
        </Button>
      </LogResultModal>
    );
  }

  return <span className="font-display text-2xl leading-none text-muted">—</span>;
}

export function FixtureCard({
  fixture,
  players,
  compact,
  usingDemoData,
  isAdmin,
  currentPlayerId,
  comments = [],
  reactions = [],
  predictions = []
}: Props) {
  const home = fixture.home_player;
  const away = fixture.away_player;
  if (!home || !away) return null;

  const role: "home" | "away" | null =
    currentPlayerId === fixture.home_player_id
      ? "home"
      : currentPlayerId === fixture.away_player_id
        ? "away"
        : null;

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
            <Link
              href={`/players/${home.id}`}
              className="block truncate font-label text-lg uppercase text-white transition hover:text-pitch"
            >
              {home.name}
            </Link>
            {!compact ? <p className="truncate text-xs text-muted">@{home.psn_tag}</p> : null}
          </div>
        </div>
        <div className="min-w-20 text-center sm:min-w-24">
          <ScoreSlot fixture={fixture} players={players} isAdmin={!!isAdmin} usingDemoData={usingDemoData} role={role} />
        </div>
        <div className="flex min-w-0 items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <Link
              href={`/players/${away.id}`}
              className="block truncate font-label text-lg uppercase text-white transition hover:text-pitch"
            >
              {away.name}
            </Link>
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
      {fixture.dispute_open && !fixture.played ? (
        <p className="mt-3 text-xs text-red-200">
          Submissions disagree. An admin will review and finalize the score.
        </p>
      ) : null}
      {fixture.voided && !fixture.played ? (
        <p className="mt-3 text-xs text-muted">
          Voided — a player withdrew. This match does not count toward standings.
        </p>
      ) : null}
      {!compact && !usingDemoData ? (
        <FixtureSocialPanel
          fixture={fixture}
          comments={comments}
          reactions={reactions}
          predictions={predictions}
          currentPlayerId={currentPlayerId}
        />
      ) : null}
    </div>
  );
}
