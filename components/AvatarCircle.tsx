import type { Player } from "@/types";
import { cn, initials } from "@/lib/utils";

type Props = {
  player: Pick<Player, "name" | "avatar_color">;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function AvatarCircle({ player, size = "md", className }: Props) {
  const dimensions = size === "sm" ? "h-9 w-9 text-sm" : size === "lg" ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg";

  return (
    <div
      className={cn(
        dimensions,
        "grid shrink-0 place-items-center rounded-full border border-white/15 font-display leading-none text-[#031008] shadow-inner",
        className
      )}
      style={{ backgroundColor: player.avatar_color ?? "#00c853" }}
      title={player.name}
    >
      {initials(player.name)}
    </div>
  );
}
