"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { logResultAction } from "@/app/actions";
import { useActionMutation } from "@/lib/hooks/use-action-mutation";
import { logResultFormSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { Fixture, Player } from "@/types";

type Props = {
  fixture: Fixture;
  players: Player[];
  children: ReactNode;
  disabled?: boolean;
};

type FormValues = z.infer<typeof logResultFormSchema>;

export function LogResultModal({ fixture, players, children, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const home = players.find((player) => player.id === fixture.home_player_id);
  const away = players.find((player) => player.id === fixture.away_player_id);

  const form = useForm<FormValues>({
    resolver: zodResolver(logResultFormSchema),
    defaultValues: {
      homeScore: 0,
      awayScore: 0,
      rageQuit: false,
      rageQuitPlayerId: "",
      comebackWin: false
    }
  });

  const rageQuit = form.watch("rageQuit");

  const mutation = useActionMutation(logResultAction, {
    successMessage: "Result logged",
    onSuccess: () => {
      setOpen(false);
      form.reset();
      setScreenshot(null);
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("fixture_id", fixture.id);
    formData.append("home_score", String(values.homeScore));
    formData.append("away_score", String(values.awayScore));
    if (values.rageQuit && values.rageQuitPlayerId) {
      formData.append("rage_quit_player_id", values.rageQuitPlayerId);
    }
    if (values.comebackWin) formData.append("comeback_win", "on");
    if (screenshot) formData.append("screenshot", screenshot);
    mutation.mutate(formData);
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset();
      setScreenshot(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
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

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`home-score-${fixture.id}`}>{home?.name} score</Label>
                <Input
                  id={`home-score-${fixture.id}`}
                  type="number"
                  min="0"
                  aria-invalid={!!form.formState.errors.homeScore}
                  {...form.register("homeScore", { valueAsNumber: true })}
                />
                {form.formState.errors.homeScore ? (
                  <p className="mt-1 text-xs text-red-300">{form.formState.errors.homeScore.message}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor={`away-score-${fixture.id}`}>{away?.name} score</Label>
                <Input
                  id={`away-score-${fixture.id}`}
                  type="number"
                  min="0"
                  aria-invalid={!!form.formState.errors.awayScore}
                  {...form.register("awayScore", { valueAsNumber: true })}
                />
                {form.formState.errors.awayScore ? (
                  <p className="mt-1 text-xs text-red-300">{form.formState.errors.awayScore.message}</p>
                ) : null}
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-white">
              <input
                type="checkbox"
                className="h-4 w-4 accent-pitch"
                {...form.register("rageQuit")}
              />
              Was this a rage quit?
            </label>

            {rageQuit ? (
              <div>
                <Label htmlFor={`rage-${fixture.id}`}>Player who rage quit</Label>
                <Select
                  id={`rage-${fixture.id}`}
                  aria-invalid={!!form.formState.errors.rageQuitPlayerId}
                  {...form.register("rageQuitPlayerId", {
                    required: rageQuit ? "Pick which player rage quit." : false
                  })}
                >
                  <option value="">Select player</option>
                  <option value={fixture.home_player_id}>{home?.name}</option>
                  <option value={fixture.away_player_id}>{away?.name}</option>
                </Select>
                {form.formState.errors.rageQuitPlayerId ? (
                  <p className="mt-1 text-xs text-red-300">
                    {form.formState.errors.rageQuitPlayerId.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            <label className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-white">
              <input
                type="checkbox"
                className="h-4 w-4 accent-pitch"
                {...form.register("comebackWin")}
              />
              Comeback win? Winner was 2+ goals down
            </label>

            <div>
              <Label htmlFor={`screenshot-${fixture.id}`}>Screenshot upload</Label>
              <Input
                id={`screenshot-${fixture.id}`}
                type="file"
                accept="image/*"
                onChange={(event) => setScreenshot(event.currentTarget.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-muted">Phone photos work — anything under 10 MB is fine.</p>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting…" : "Submit Result"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
