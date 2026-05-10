"use client";

import { useMemo, useState } from "react";
import { getHeadToHeadResult } from "@/lib/fixtures";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import type { Fixture, Player } from "@/types";

type Props = {
  players: Player[];
  fixtures: Fixture[];
};

export function HeadToHeadLookup({ players, fixtures }: Props) {
  const [playerA, setPlayerA] = useState(players[0]?.id ?? "");
  const [playerB, setPlayerB] = useState(players[1]?.id ?? "");

  const summary = useMemo(() => {
    if (!playerA || !playerB || playerA === playerB) return null;
    return getHeadToHeadResult(fixtures, playerA, playerB);
  }, [fixtures, playerA, playerB]);

  const winnerName =
    summary?.winner && summary.winner !== "draw"
      ? players.find((player) => player.id === summary.winner)?.name
      : summary?.winner === "draw"
        ? "Shared"
        : "Pending";

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="font-display text-4xl uppercase leading-none text-white">Head to Head</h2>
        <p className="text-sm text-muted">Compare both legs, aggregate, and away goals.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <Label>Player A</Label>
          <Select value={playerA} onChange={(event) => setPlayerA(event.target.value)}>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Player B</Label>
          <Select value={playerB} onChange={(event) => setPlayerB(event.target.value)}>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="button" variant="secondary">
          Compare
        </Button>
      </div>

      {summary ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md bg-white/[0.05] p-3">
            <p className="font-label text-xs uppercase text-muted">Aggregate</p>
            <p className="font-display text-3xl text-white sm:text-4xl">
              {summary.aggregateA} - {summary.aggregateB}
            </p>
          </div>
          <div className="rounded-md bg-white/[0.05] p-3">
            <p className="font-label text-xs uppercase text-muted">Away Goals</p>
            <p className="font-display text-3xl text-white sm:text-4xl">
              {summary.awayGoalsA} - {summary.awayGoalsB}
            </p>
          </div>
          <div className="rounded-md bg-white/[0.05] p-3">
            <p className="font-label text-xs uppercase text-muted">Winner</p>
            <p className="font-display text-3xl text-gold sm:text-4xl">{winnerName}</p>
          </div>
          <div className="rounded-md bg-white/[0.05] p-3">
            <p className="font-label text-xs uppercase text-muted">Legs Played</p>
            <p className="font-display text-3xl text-white sm:text-4xl">{summary.fixtures.length}/2</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Pick two different players.</p>
      )}
    </Card>
  );
}
