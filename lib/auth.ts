import { createSupabaseAdminClient } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Player } from "@/types";

export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function isAdminUser() {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
  if (!adminEmail) return false;
  const user = await getCurrentUser();
  return user?.email?.toLowerCase() === adminEmail;
}

export async function requireAdminUser() {
  if (!(await isAdminUser())) {
    throw new Error("Admin access required.");
  }
}

export async function getCurrentPlayer(): Promise<Player | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return (data as Player | null) ?? null;
}

export type FixtureRole = "home" | "away";

export async function requireFixtureParticipant(fixtureId: string): Promise<{
  role: FixtureRole;
  player: Player;
  fixture: { id: string; home_player_id: string; away_player_id: string; season_id: string };
}> {
  const player = await getCurrentPlayer();
  if (!player) {
    throw new Error("You must be signed in and linked to a squad name to do that.");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: fixture, error } = await supabase
    .from("fixtures")
    .select("id, home_player_id, away_player_id, season_id")
    .eq("id", fixtureId)
    .single();
  if (error) throw new Error(error.message);

  if (fixture.home_player_id === player.id) return { role: "home", player, fixture };
  if (fixture.away_player_id === player.id) return { role: "away", player, fixture };
  throw new Error("You are not a participant in this fixture.");
}
