import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, action }: Props) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="font-label text-sm uppercase tracking-wide text-pitch">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-4xl uppercase leading-none text-white sm:text-5xl lg:text-6xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
