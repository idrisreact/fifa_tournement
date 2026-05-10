import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "green" | "gold" | "red";
};

export function Badge({ className, variant = "default", ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 font-label text-xs uppercase tracking-wide",
        variant === "default" && "border-white/10 bg-white/[0.06] text-muted",
        variant === "green" && "border-pitch/35 bg-pitch/10 text-pitch",
        variant === "gold" && "border-gold/35 bg-gold/10 text-gold",
        variant === "red" && "border-red-400/35 bg-red-500/10 text-red-200",
        className
      )}
      {...props}
    />
  );
}
