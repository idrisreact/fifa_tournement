"use client";

import { useMemo, useState } from "react";
import { Save, Search, X } from "lucide-react";
import { logResultAction } from "@/app/actions";
import { AdminActionForm } from "@/components/AdminActionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import type { Fixture, Player } from "@/types";

type Props = {
  fixtures: Fixture[];
  players: Player[];
  usingDemoData?: boolean;
};

type StatusFilter = "all" | "pending" | "played" | "disputed";

function fixtureStatus(fixture: Fixture) {
  if (fixture.dispute_open) return "disputed";
  if (fixture.played) return "played";
  if (fixture.home_submitted_at || fixture.away_submitted_at) return "pending";
  if (fixture.voided) return "voided";
  return "open";
}

function defaultHomeScore(fixture: Fixture) {
  return (
    fixture.home_score ??
    fixture.home_submitted_home_score ??
    fixture.away_submitted_home_score ??
    0
  );
}

function defaultAwayScore(fixture: Fixture) {
  return (
    fixture.away_score ??
    fixture.home_submitted_away_score ??
    fixture.away_submitted_away_score ??
    0
  );
}

export function AdminOverrideResults({ fixtures, players, usingDemoData }: Props) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [playerOneId, setPlayerOneId] = useState("");
  const [playerTwoId, setPlayerTwoId] = useState("");

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name)),
    [players]
  );

  const filteredFixtures = useMemo(() => {
    const query = search.trim().toLowerCase();

    return fixtures.filter((fixture) => {
      const currentStatus = fixtureStatus(fixture);
      if (status !== "all" && currentStatus !== status) return false;

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
          currentStatus,
          `${defaultHomeScore(fixture)}-${defaultAwayScore(fixture)}`
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      return true;
    });
  }, [fixtures, playerOneId, playerTwoId, search, status]);

  const hasFilters = status !== "all" || search || playerOneId || playerTwoId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Override Result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-[#0b1420] p-3 sm:p-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["all", "pending", "played", "disputed"] as StatusFilter[]).map((item) => (
              <Button
                key={item}
                type="button"
                variant={status === item ? "primary" : "secondary"}
                onClick={() => setStatus(item)}
                className="shrink-0"
              >
                {item}
              </Button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="admin-fixture-search">Search fixtures</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="admin-fixture-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Player, PSN, matchday, score"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-player-one">Player one</Label>
              <Select
                id="admin-player-one"
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
              <Label htmlFor="admin-player-two">Player two</Label>
              <Select
                id="admin-player-two"
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
                setStatus("all");
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
            Showing {filteredFixtures.length} of {fixtures.length} fixtures
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {filteredFixtures.map((fixture) => (
            <AdminActionForm
              key={fixture.id}
              action={logResultAction}
              successMessage="Result saved"
              className="rounded-lg border border-white/10 bg-[#0b1420] p-4"
            >
              <input type="hidden" name="fixture_id" value={fixture.id} />
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-label text-lg uppercase text-white">
                    MD {fixture.matchday}: {fixture.home_player?.name} vs {fixture.away_player?.name}
                  </p>
                  <p className="text-xs uppercase text-muted">
                    Leg {fixture.leg} - {fixtureStatus(fixture)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <Label>Home</Label>
                  <Input
                    name="home_score"
                    type="number"
                    min="0"
                    defaultValue={defaultHomeScore(fixture)}
                    disabled={usingDemoData}
                  />
                </div>
                <div>
                  <Label>Away</Label>
                  <Input
                    name="away_score"
                    type="number"
                    min="0"
                    defaultValue={defaultAwayScore(fixture)}
                    disabled={usingDemoData}
                  />
                </div>
                <div>
                  <Label>Rage Quit</Label>
                  <Select
                    name="rage_quit_player_id"
                    defaultValue={fixture.rage_quit_player_id ?? ""}
                    disabled={usingDemoData}
                  >
                    <option value="">None</option>
                    <option value={fixture.home_player_id}>{fixture.home_player?.name}</option>
                    <option value={fixture.away_player_id}>{fixture.away_player?.name}</option>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full" disabled={usingDemoData}>
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                <input
                  name="comeback_win"
                  type="checkbox"
                  defaultChecked={fixture.comeback_win}
                  className="h-4 w-4 accent-pitch"
                  disabled={usingDemoData}
                />
                Comeback win
              </label>
            </AdminActionForm>
          ))}
        </div>

        {filteredFixtures.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-[#0b1420] p-8 text-center text-muted">
            No fixtures match these filters.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
