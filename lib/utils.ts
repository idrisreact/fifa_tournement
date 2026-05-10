import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Fixture, Player, Standing } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function goalDifference(standing: Pick<Standing, "gf" | "ga">) {
  return standing.gf - standing.ga;
}

export function playerName(players: Player[], id: string) {
  return players.find((player) => player.id === id)?.name ?? "Unknown";
}

export function attachPlayers(fixtures: Fixture[], players: Player[]) {
  return fixtures.map((fixture) => ({
    ...fixture,
    home_player: players.find((player) => player.id === fixture.home_player_id) ?? null,
    away_player: players.find((player) => player.id === fixture.away_player_id) ?? null
  }));
}

export const AVATAR_COLORS = [
  "#00c853",
  "#FFD700",
  "#28a3ff",
  "#ff4d6d",
  "#9b5cff",
  "#ff8a00",
  "#00d1ff",
  "#f72585",
  "#6ee7b7",
  "#f97316",
  "#a3e635",
  "#e879f9",
  "#facc15",
  "#22d3ee",
  "#fb7185",
  "#a855f7",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#f43f5e"
];

export function formatRecord(wins: number, draws: number, losses: number) {
  return `${wins}-${draws}-${losses}`;
}
