import type { Player } from "@/types";
import { initials } from "@/lib/utils";

type Props = {
  player: Pick<Player, "name" | "avatar_color">;
  size?: "sm" | "md" | "lg";
};

export function AvatarCircle({ player, size = "md" }: Props) {
  const dimensions = size === "sm" ? "h-9 w-9 text-sm" : size === "lg" ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg";

  return (
    <div
      className={`${dimensions} grid shrink-0 place-items-center rounded-full border border-white/15 font-display leading-none text-[#031008] shadow-inner`}
      style={{ backgroundColor: player.avatar_color ?? "#00c853" }}
      title={player.name}
    >
      {initials(player.name)}
    </div>
  );
}
