import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type Props = {
  label: string;
  value: ReactNode;
  name: string;
  detail?: string;
};

export function StatCard({ label, value, name, detail }: Props) {
  return (
    <Card className="p-5">
      <p className="font-label text-sm uppercase tracking-wide text-pitch">{label}</p>
      <div className="mt-2 font-display text-5xl uppercase leading-none text-white">{value}</div>
      <p className="mt-2 font-semibold text-white">{name}</p>
      {detail ? <p className="text-sm text-muted">{detail}</p> : null}
    </Card>
  );
}
