"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Standing } from "@/types";

type Props = {
  standings: Standing[];
};

export function StatsCharts({ standings }: Props) {
  const data = standings.map((standing) => ({
    name: standing.player?.name ?? "Player",
    goals: standing.gf,
    points: standing.pts,
    bonus: standing.bonus_pts
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-64 rounded-lg border border-white/10 bg-panel p-4 sm:h-80">
        <p className="mb-4 font-label text-sm uppercase tracking-wide text-muted">Goals For</p>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#8da0b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#8da0b8", fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.06)" }}
              contentStyle={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.12)" }}
            />
            <Bar dataKey="goals" fill="#00c853" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 rounded-lg border border-white/10 bg-panel p-4 sm:h-80">
        <p className="mb-4 font-label text-sm uppercase tracking-wide text-muted">Total Points</p>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#8da0b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#8da0b8", fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.06)" }}
              contentStyle={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.12)" }}
            />
            <Bar dataKey="points" fill="#FFD700" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
