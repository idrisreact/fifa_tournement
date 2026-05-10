"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { logResultAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { Fixture, Player } from "@/types";

type Props = {
  fixture: Fixture;
  players: Player[];
  children: ReactNode;
  disabled?: boolean;
};

export function LogResultModal({ fixture, players, children, disabled }: Props) {
  const [rageQuit, setRageQuit] = useState(false);
  const [open, setOpen] = useState(false);
  const home = players.find((player) => player.id === fixture.home_player_id);
  const away = players.find((player) => player.id === fixture.away_player_id);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild disabled={disabled}>
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-4 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-y-auto rounded-lg border border-white/10 bg-panel p-5 shadow-2xl max-h-[calc(100dvh-2rem)] sm:top-1/2 sm:-translate-y-1/2">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-4xl uppercase leading-none text-white">
                Log Result
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">
                Matchday {fixture.matchday}: {home?.name} vs {away?.name}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          <form action={logResultAction} className="space-y-4">
            <input type="hidden" name="fixture_id" value={fixture.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`home-score-${fixture.id}`}>{home?.name} score</Label>
                <Input id={`home-score-${fixture.id}`} name="home_score" type="number" min="0" required />
              </div>
              <div>
                <Label htmlFor={`away-score-${fixture.id}`}>{away?.name} score</Label>
                <Input id={`away-score-${fixture.id}`} name="away_score" type="number" min="0" required />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-white">
              <input
                type="checkbox"
                className="h-4 w-4 accent-pitch"
                checked={rageQuit}
                onChange={(event) => setRageQuit(event.currentTarget.checked)}
              />
              Was this a rage quit?
            </label>

            {rageQuit ? (
              <div>
                <Label htmlFor={`rage-${fixture.id}`}>Player who rage quit</Label>
                <Select id={`rage-${fixture.id}`} name="rage_quit_player_id" required>
                  <option value="">Select player</option>
                  <option value={fixture.home_player_id}>{home?.name}</option>
                  <option value={fixture.away_player_id}>{away?.name}</option>
                </Select>
              </div>
            ) : null}

            <label className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-white">
              <input name="comeback_win" type="checkbox" className="h-4 w-4 accent-pitch" />
              Comeback win? Winner was 2+ goals down
            </label>

            <div>
              <Label htmlFor={`screenshot-${fixture.id}`}>Screenshot upload</Label>
              <Input id={`screenshot-${fixture.id}`} name="screenshot" type="file" accept="image/*" />
            </div>

            <Button type="submit" className="w-full">
              Submit Result
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
