"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { FixtureCard } from "@/components/FixtureCard";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { Fixture, FixtureComment, FixtureReaction, Player, Prediction } from "@/types";

type Filter = "all" | "upcoming" | "played";

type Props = {
  players: Player[];
  fixtures: Fixture[];
  usingDemoData?: boolean;
  isAdmin?: boolean;
  currentPlayerId?: string | null;
  comments?: FixtureComment[];
  reactions?: FixtureReaction[];
  predictions?: Prediction[];
};

export function FixturesClient({
  players,
  fixtures,
  usingDemoData,
  isAdmin,
  currentPlayerId,
  comments = [],
  reactions = [],
  predictions = []
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [playerOneId, setPlayerOneId] = useState("");
  const [playerTwoId, setPlayerTwoId] = useState("");

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name)),
    [players]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return fixtures.filter((fixture) => {
      if (filter === "played" && !fixture.played) return false;
      if (filter === "upcoming" && (fixture.played || fixture.voided)) return false;

      const fixturePlayerIds = [fixture.home_player_id, fixture.away_player_id];
      if (playerOneId && !fixturePlayerIds.includes(playerOneId)) return false;
      if (playerTwoId && !fixturePlayerIds.includes(playerTwoId)) return false;

      if (query) {
        const searchable = [
          fixture.home_player?.name,
          fixture.home_player?.psn_tag,
          fixture.away_player?.name,
          fixture.away_player?.psn_tag,
          `matchday ${fixture.matchday}`,
          `md ${fixture.matchday}`,
          `leg ${fixture.leg}`,
          fixture.played && fixture.home_score !== null && fixture.away_score !== null
            ? `${fixture.home_score}-${fixture.away_score}`
            : null
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      return true;
    });
  }, [fixtures, filter, playerOneId, playerTwoId, search]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<number, Fixture[]>>((groups, fixture) => {
      groups[fixture.matchday] = [...(groups[fixture.matchday] ?? []), fixture];
      return groups;
    }, {});
  }, [filtered]);

  const hasFilters = filter !== "all" || search || playerOneId || playerTwoId;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-panel/80 p-3 sm:p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "upcoming", "played"] as Filter[]).map((item) => (
            <Button
              key={item}
              type="button"
              variant={filter === item ? "primary" : "secondary"}
              onClick={() => setFilter(item)}
              className="shrink-0"
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="fixture-search">Search fixtures</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="fixture-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Player, PSN, matchday, score"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fixture-player-one">Player one</Label>
            <Select
              id="fixture-player-one"
              value={playerOneId}
              onChange={(event) => {
                setPlayerOneId(event.target.value);
                if (event.target.value === playerTwoId) setPlayerTwoId("");
              }}
            >
              <option value="">Any player</option>
              {sortedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fixture-player-two">Player two</Label>
            <Select
              id="fixture-player-two"
              value={playerTwoId}
              onChange={(event) => setPlayerTwoId(event.target.value)}
            >
              <option value="">Any opponent</option>
              {sortedPlayers.map((player) => (
                <option key={player.id} value={player.id} disabled={player.id === playerOneId}>
                  {player.name}
                </option>
              ))}
            </Select>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setFilter("all");
              setSearch("");
              setPlayerOneId("");
              setPlayerTwoId("");
            }}
            disabled={!hasFilters}
            className="w-full md:w-auto"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>

        <p className="mt-3 text-sm text-muted">
          Showing {filtered.length} of {fixtures.length} fixtures
        </p>
      </div>

      {Object.entries(grouped).map(([matchday, matchdayFixtures]) => (
        <section key={matchday} className="rounded-lg border border-white/10 bg-panel/70 p-3 sm:p-4">
          <h2 className="mb-3 font-display text-3xl uppercase leading-none text-white sm:mb-4 sm:text-4xl">
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
                comments={comments.filter((comment) => comment.fixture_id === fixture.id)}
                reactions={reactions.filter((reaction) => reaction.fixture_id === fixture.id)}
                predictions={predictions.filter((prediction) => prediction.fixture_id === fixture.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-panel p-8 text-center text-muted">
          No fixtures match these filters.
        </div>
      ) : null}
    </div>
  );
}
