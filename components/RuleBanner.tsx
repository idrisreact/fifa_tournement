import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

type Props = {
  title: string;
  items: string[];
};

export function RuleBanner({ title, items }: Props) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-pitch/12 text-pitch">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <h2 className="font-display text-4xl uppercase leading-none text-white">{title}</h2>
      </div>
      <ul className="space-y-2 text-sm text-muted">
        {items.map((item) => (
          <li key={item} className="border-l border-pitch/40 pl-3">
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
