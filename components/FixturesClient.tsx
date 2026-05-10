"use client";

import { useMemo, useState } from "react";
import { FixtureCard } from "@/components/FixtureCard";
import { Button } from "@/components/ui/button";
import type { Fixture, Player } from "@/types";

type Filter = "all" | "upcoming" | "played";

type Props = {
  players: Player[];
  fixtures: Fixture[];
  usingDemoData?: boolean;
  isAdmin?: boolean;
  currentPlayerId?: string | null;
};

export function FixturesClient({ players, fixtures, usingDemoData, isAdmin, currentPlayerId }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return fixtures.filter((fixture) => {
      if (filter === "played") return fixture.played;
      if (filter === "upcoming") return !fixture.played && !fixture.voided;
      return true;
    });
  }, [fixtures, filter]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<number, Fixture[]>>((groups, fixture) => {
      groups[fixture.matchday] = [...(groups[fixture.matchday] ?? []), fixture];
      return groups;
    }, {});
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["all", "upcoming", "played"] as Filter[]).map((item) => (
          <Button
            key={item}
            type="button"
            variant={filter === item ? "primary" : "secondary"}
            onClick={() => setFilter(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      {Object.entries(grouped).map(([matchday, matchdayFixtures]) => (
        <section key={matchday} className="rounded-lg border border-white/10 bg-panel/70 p-4">
          <h2 className="mb-4 font-display text-4xl uppercase leading-none text-white">
            Matchday {matchday}
          </h2>
          <div className="grid gap-3 xl:grid-cols-2">
            {matchdayFixtures.map((fixture) => (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                players={players}
                usingDemoData={usingDemoData}
                isAdmin={isAdmin}
                currentPlayerId={currentPlayerId}
              />
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-panel p-8 text-center text-muted">
          No fixtures match this filter.
        </div>
      ) : null}
    </div>
  );
}
