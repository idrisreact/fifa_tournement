"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { manualPointsAction } from "@/app/actions";
import { useActionMutation } from "@/lib/hooks/use-action-mutation";
import { manualPointsFormSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Standing } from "@/types";

type FormValues = z.infer<typeof manualPointsFormSchema>;

type Props = {
  seasonId: string;
  standings: Standing[];
  disabled?: boolean;
};

export function ManualPointsForm({ seasonId, standings, disabled }: Props) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(manualPointsFormSchema),
    defaultValues: {
      playerId: standings[0]?.player_id ?? "",
      points: 1,
      reason: ""
    }
  });

  const mutation = useActionMutation(manualPointsAction, {
    successMessage: (_data, formData) => {
      const playerId = String(formData.get("player_id") ?? "");
      const points = Number(formData.get("points") ?? 0);
      const playerName =
        standings.find((row) => row.player_id === playerId)?.player?.name ?? "player";
      const sign = points > 0 ? "+" : "";
      return `Adjustment applied — ${sign}${points} to ${playerName}`;
    },
    onSuccess: () => {
      form.reset({
        playerId: form.getValues("playerId"),
        points: 1,
        reason: ""
      });
      router.refresh();
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("season_id", seasonId);
    formData.append("player_id", values.playerId);
    formData.append("points", String(values.points));
    if (values.reason) formData.append("reason", values.reason);
    mutation.mutate(formData);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="manual-player">Player</Label>
          <Select
            id="manual-player"
            disabled={disabled}
            aria-invalid={!!form.formState.errors.playerId}
            {...form.register("playerId")}
          >
            {standings.map((standing) => (
              <option key={standing.player_id} value={standing.player_id}>
                {standing.player?.name}
              </option>
            ))}
          </Select>
          {form.formState.errors.playerId ? (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.playerId.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="manual-points">Points</Label>
          <Input
            id="manual-points"
            type="number"
            disabled={disabled}
            aria-invalid={!!form.formState.errors.points}
            {...form.register("points", { valueAsNumber: true })}
          />
          {form.formState.errors.points ? (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.points.message}</p>
          ) : null}
        </div>
      </div>
      <div>
        <Label htmlFor="manual-reason">Reason note</Label>
        <Textarea
          id="manual-reason"
          placeholder="Admin correction note"
          disabled={disabled}
          {...form.register("reason")}
        />
        <p className="mt-1 text-xs text-muted">
          Note is shown to you in this session; it isn&apos;t persisted.
        </p>
      </div>
      <Button type="submit" disabled={disabled || mutation.isPending}>
        <Shield className="h-4 w-4" />
        {mutation.isPending ? "Applying…" : "Apply Adjustment"}
      </Button>
    </form>
  );
}
