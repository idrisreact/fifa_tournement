"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { submitResultAction } from "@/app/actions";
import { useActionMutation } from "@/lib/hooks/use-action-mutation";
import { submitResultFormSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Fixture, Player } from "@/types";

type Props = {
  fixture: Fixture;
  players: Player[];
  children: ReactNode;
};

type FormValues = z.infer<typeof submitResultFormSchema>;

const STATUS_TOAST: Record<"pending" | "confirmed" | "dispute", string> = {
  pending: "Score submitted — waiting for opponent",
  confirmed: "Result confirmed!",
  dispute: "Submitted — admin will review (scores don't match)"
};

export function SubmitResultModal({ fixture, players, children }: Props) {
  const [open, setOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const home = players.find((player) => player.id === fixture.home_player_id);
  const away = players.find((player) => player.id === fixture.away_player_id);

  const form = useForm<FormValues>({
    resolver: zodResolver(submitResultFormSchema),
    defaultValues: { homeScore: 0, awayScore: 0 }
  });

  const mutation = useActionMutation(submitResultAction, {
    successMessage: (data) => STATUS_TOAST[data.status],
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

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`submit-home-${fixture.id}`}>{home?.name} score</Label>
                <Input
                  id={`submit-home-${fixture.id}`}
                  type="number"
                  min="0"
                  aria-invalid={!!form.formState.errors.homeScore}
                  {...form.register("homeScore", { valueAsNumber: true })}
                />
                {form.formState.errors.homeScore ? (
                  <p className="mt-1 text-xs text-red-300">
                    {form.formState.errors.homeScore.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor={`submit-away-${fixture.id}`}>{away?.name} score</Label>
                <Input
                  id={`submit-away-${fixture.id}`}
                  type="number"
                  min="0"
                  aria-invalid={!!form.formState.errors.awayScore}
                  {...form.register("awayScore", { valueAsNumber: true })}
                />
                {form.formState.errors.awayScore ? (
                  <p className="mt-1 text-xs text-red-300">
                    {form.formState.errors.awayScore.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div>
              <Label htmlFor={`submit-screenshot-${fixture.id}`}>Screenshot (optional)</Label>
              <Input
                id={`submit-screenshot-${fixture.id}`}
                type="file"
                accept="image/*"
                onChange={(event) => setScreenshot(event.currentTarget.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-muted">Phone photos work — anything under 10 MB is fine.</p>
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting…" : "Submit My Score"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
