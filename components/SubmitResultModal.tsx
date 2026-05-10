"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { submitResultAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Fixture, Player } from "@/types";

type Props = {
  fixture: Fixture;
  players: Player[];
  children: ReactNode;
};

export function SubmitResultModal({ fixture, players, children }: Props) {
  const [open, setOpen] = useState(false);
  const home = players.find((player) => player.id === fixture.home_player_id);
  const away = players.find((player) => player.id === fixture.away_player_id);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-4 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-y-auto rounded-lg border border-white/10 bg-panel p-5 shadow-2xl max-h-[calc(100dvh-2rem)] sm:top-1/2 sm:-translate-y-1/2">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-3xl uppercase leading-none text-white sm:text-4xl">
                Submit Result
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

          <p className="mb-4 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-muted">
            Your opponent submits independently. The result is only confirmed if both scores match.
          </p>

          <form action={submitResultAction} className="space-y-4">
            <input type="hidden" name="fixture_id" value={fixture.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`submit-home-${fixture.id}`}>{home?.name} score</Label>
                <Input id={`submit-home-${fixture.id}`} name="home_score" type="number" min="0" required />
              </div>
              <div>
                <Label htmlFor={`submit-away-${fixture.id}`}>{away?.name} score</Label>
                <Input id={`submit-away-${fixture.id}`} name="away_score" type="number" min="0" required />
              </div>
            </div>
            <div>
              <Label htmlFor={`submit-screenshot-${fixture.id}`}>Screenshot (optional)</Label>
              <Input id={`submit-screenshot-${fixture.id}`} name="screenshot" type="file" accept="image/*" />
            </div>
            <Button type="submit" className="w-full">
              Submit My Score
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
