import type { SeasonStatus } from "@/types";
import { cn } from "@/lib/utils";

export function StatusChip({ status }: { status: SeasonStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3 font-label text-sm uppercase tracking-wide",
        status === "setup" && "border-sky-300/30 bg-sky-400/10 text-sky-200",
        status === "active" && "border-pitch/40 bg-pitch/10 text-pitch",
        status === "complete" && "border-gold/40 bg-gold/10 text-gold"
      )}
    >
      {status}
    </span>
  );
}
