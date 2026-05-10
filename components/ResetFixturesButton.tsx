"use client";

import { Trash2 } from "lucide-react";
import { resetAllFixturesAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

type Props = {
  seasonId: string;
  fixtureCount: number;
  disabled?: boolean;
};

export function ResetFixturesButton({ seasonId, fixtureCount, disabled }: Props) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const message = `This will delete all ${fixtureCount} fixtures and clear standings for the season. Players stay in the squad. Continue?`;
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  };

  return (
    <form action={resetAllFixturesAction} onSubmit={handleSubmit}>
      <input type="hidden" name="season_id" value={seasonId} />
      <Button type="submit" variant="danger" className="w-full" disabled={disabled}>
        <Trash2 className="h-4 w-4" />
        Reset All Fixtures
      </Button>
    </form>
  );
}
