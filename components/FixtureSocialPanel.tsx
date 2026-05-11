import { Flame, Laugh, MessageSquare, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toggleFixtureReactionAction, upsertPredictionAction } from "@/app/actions";
import { AvatarCircle } from "@/components/AvatarCircle";
import { CommentForm } from "@/components/CommentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Fixture,
  FixtureComment,
  FixtureReaction,
  FixtureReactionType,
  Prediction
} from "@/types";

type Props = {
  fixture: Fixture;
  comments: FixtureComment[];
  reactions: FixtureReaction[];
  predictions: Prediction[];
  currentPlayerId?: string | null;
};

const reactionOptions: Array<{
  value: FixtureReactionType;
  label: string;
  icon: typeof Flame;
}> = [
  { value: "fire", label: "Fire", icon: Flame },
  { value: "shock", label: "Shock", icon: Zap },
  { value: "laugh", label: "Laugh", icon: Laugh },
  { value: "respect", label: "Respect", icon: ShieldCheck }
];

export function FixtureSocialPanel({
  fixture,
  comments,
  reactions,
  predictions,
  currentPlayerId
}: Props) {
  const canInteract = !!currentPlayerId && !fixture.voided;
  const myPrediction = predictions.find((prediction) => prediction.player_id === currentPlayerId);
  const predictionLocked = fixture.played || fixture.voided;
  const exactPredictions =
    fixture.played && fixture.home_score !== null && fixture.away_score !== null
      ? predictions.filter(
          (prediction) =>
            prediction.home_score === fixture.home_score &&
            prediction.away_score === fixture.away_score
        )
      : [];

  return (
    <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
      <div className="flex flex-wrap gap-2">
        {reactionOptions.map((option) => {
          const Icon = option.icon;
          const count = reactions.filter((reaction) => reaction.reaction === option.value).length;
          const active = reactions.some(
            (reaction) =>
              reaction.reaction === option.value && reaction.player_id === currentPlayerId
          );

          return (
            <form key={option.value} action={toggleFixtureReactionAction}>
              <input type="hidden" name="fixture_id" value={fixture.id} />
              <input type="hidden" name="reaction" value={option.value} />
              <Button
                type="submit"
                size="sm"
                variant={active ? "gold" : "secondary"}
                disabled={!canInteract}
                title={option.label}
              >
                <Icon className="h-4 w-4" />
                <span>{count}</span>
              </Button>
            </form>
          );
        })}
      </div>

      <div className="rounded-md bg-white/[0.04] p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 font-label text-sm uppercase tracking-wide text-muted">
            <Sparkles className="h-4 w-4 text-gold" />
            Predictions
          </p>
          <p className="text-xs text-muted">
            {predictions.length} pick{predictions.length === 1 ? "" : "s"}
          </p>
        </div>

        {predictionLocked ? (
          <p className="text-sm text-muted">
            {fixture.played
              ? `${exactPredictions.length} exact score pick${
                  exactPredictions.length === 1 ? "" : "s"
                }.`
              : "Predictions are closed for this fixture."}
          </p>
        ) : canInteract ? (
          <form action={upsertPredictionAction} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input type="hidden" name="fixture_id" value={fixture.id} />
            <Input
              aria-label="Home prediction"
              name="home_score"
              type="number"
              min={0}
              max={99}
              defaultValue={myPrediction?.home_score ?? ""}
              placeholder="H"
              required
            />
            <Input
              aria-label="Away prediction"
              name="away_score"
              type="number"
              min={0}
              max={99}
              defaultValue={myPrediction?.away_score ?? ""}
              placeholder="A"
              required
            />
            <Button type="submit" size="sm" variant="gold">
              Pick
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted">Sign in and claim a player to predict.</p>
        )}
      </div>

      <div className="space-y-3">
        <p className="inline-flex items-center gap-2 font-label text-sm uppercase tracking-wide text-muted">
          <MessageSquare className="h-4 w-4 text-pitch" />
          Comments
        </p>
        {comments.length ? (
          <div className="space-y-2">
            {comments.slice(-3).map((comment) => (
              <div key={comment.id} className="flex gap-3 rounded-md bg-white/[0.04] p-3">
                {comment.player ? <AvatarCircle player={comment.player} size="sm" /> : null}
                <div className="min-w-0">
                  <p className="font-label text-xs uppercase tracking-wide text-white">
                    {comment.player?.name ?? "Player"}
                  </p>
                  <p className="break-words text-sm text-muted">{comment.body}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No comments yet.</p>
        )}

        {canInteract ? <CommentForm fixtureId={fixture.id} /> : null}
      </div>
    </div>
  );
}
