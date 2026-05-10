import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type Props = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
};

export function MetricCard({ label, value, detail }: Props) {
  return (
    <Card className="animate-fadeUp p-5">
      <p className="font-label text-sm uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-2 font-display text-5xl uppercase leading-none text-white">{value}</div>
      {detail ? <p className="mt-2 text-sm text-muted">{detail}</p> : null}
    </Card>
  );
}
