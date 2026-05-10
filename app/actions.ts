"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateRoundRobin } from "@/lib/fixtures";
import { calculateStandings } from "@/lib/standings";
import { AVATAR_COLORS } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Fixture, Player } from "@/types";

const scoreSchema = z.object({
  fixtureId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  rageQuitPlayerId: z.string().optional().nullable(),
  comebackWin: z.coerce.boolean().optional().default(false)
});

function requireAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add environment variables in .env.local.");
  }
  return supabase;
}

function refreshApp() {
  ["/", "/squad", "/fixtures", "/standings", "/stats", "/admin"].forEach((path) =>
    revalidatePath(path)
  );
}

export async function signInWithGoogle() {
  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase Auth is not configured.");

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` }
  });

  if (error) throw new Error(error.message);
  if (data.url) redirect(data.url);
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase Auth is not configured.");

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` }
  });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase?.auth.signOut();
  revalidatePath("/admin");
}

export async function addPlayerAction(formData: FormData) {
  const supabase = requireAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const psnTag = String(formData.get("psn_tag") ?? "").trim();

  if (!name || !psnTag) throw new Error("Name and PSN tag are required.");

  const { count } = await supabase.from("players").select("*", { count: "exact", head: true });
  if ((count ?? 0) >= 12) throw new Error("The squad is already full.");

  const avatarColor = AVATAR_COLORS[count ?? 0] ?? AVATAR_COLORS[0];
  const { error } = await supabase
    .from("players")
    .insert({ name, psn_tag: psnTag, avatar_color: avatarColor });

  if (error) throw new Error(error.message);
  refreshApp();
}

export async function removePlayerAction(formData: FormData) {
  const supabase = requireAdminClient();
  const playerId = String(formData.get("player_id") ?? "");

  const { count } = await supabase.from("fixtures").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) throw new Error("Players can only be removed before fixtures are generated.");

  const { error } = await supabase.from("players").delete().eq("id", playerId);
  if (error) throw new Error(error.message);
  refreshApp();
}

export async function generateFixturesAction(formData: FormData) {
  const supabase = requireAdminClient();
  const seasonId = String(formData.get("season_id") ?? "");

  const [{ data: players, error: playersError }, { count, error: countError }] = await Promise.all([
    supabase.from("players").select("*").order("created_at", { ascending: true }),
    supabase.from("fixtures").select("*", { count: "exact", head: true }).eq("season_id", seasonId)
  ]);

  if (playersError) throw new Error(playersError.message);
  if (countError) throw new Error(countError.message);
  if ((players ?? []).length < 2) throw new Error("Add at least two players before generating fixtures.");
  if ((count ?? 0) > 0) throw new Error("Fixtures have already been generated.");

  const fixtures = generateRoundRobin(players as Player[], seasonId);
  const { error } = await supabase.from("fixtures").insert(fixtures);
  if (error) throw new Error(error.message);

  await recalculateStandings(seasonId);
  refreshApp();
}

export async function logResultAction(formData: FormData) {
  const supabase = requireAdminClient();
  const parsed = scoreSchema.parse({
    fixtureId: formData.get("fixture_id"),
    homeScore: formData.get("home_score"),
    awayScore: formData.get("away_score"),
    rageQuitPlayerId: formData.get("rage_quit_player_id") || null,
    comebackWin: formData.get("comeback_win") === "on"
  });

  const { data: fixture, error: fixtureError } = await supabase
    .from("fixtures")
    .select("*")
    .eq("id", parsed.fixtureId)
    .single();

  if (fixtureError) throw new Error(fixtureError.message);

  let screenshotUrl: string | null = null;
  const screenshot = formData.get("screenshot");
  if (screenshot instanceof File && screenshot.size > 0) {
    const extension = screenshot.name.split(".").pop() ?? "png";
    const path = `${fixture.season_id}/${parsed.fixtureId}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("screenshots")
      .upload(path, screenshot, { contentType: screenshot.type, upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from("screenshots").getPublicUrl(path);
    screenshotUrl = data.publicUrl;
  }

  const rageQuitScore =
    parsed.rageQuitPlayerId === fixture.home_player_id
      ? { home_score: 0, away_score: 3 }
      : parsed.rageQuitPlayerId === fixture.away_player_id
        ? { home_score: 3, away_score: 0 }
        : { home_score: parsed.homeScore, away_score: parsed.awayScore };

  const { error } = await supabase
    .from("fixtures")
    .update({
      ...rageQuitScore,
      played: true,
      rage_quit_player_id: parsed.rageQuitPlayerId,
      comeback_win: parsed.comebackWin,
      result_screenshot_url: screenshotUrl,
      played_at: new Date().toISOString()
    })
    .eq("id", parsed.fixtureId);

  if (error) throw new Error(error.message);
  await recalculateStandings(fixture.season_id);
  refreshApp();
}

export async function resetFixtureAction(formData: FormData) {
  const supabase = requireAdminClient();
  const fixtureId = String(formData.get("fixture_id") ?? "");

  const { data: fixture, error: fixtureError } = await supabase
    .from("fixtures")
    .select("season_id")
    .eq("id", fixtureId)
    .single();
  if (fixtureError) throw new Error(fixtureError.message);

  const { error } = await supabase
    .from("fixtures")
    .update({
      home_score: null,
      away_score: null,
      played: false,
      rage_quit_player_id: null,
      comeback_win: false,
      result_screenshot_url: null,
      played_at: null
    })
    .eq("id", fixtureId);
  if (error) throw new Error(error.message);

  await recalculateStandings(fixture.season_id);
  refreshApp();
}

export async function updateSeasonStatusAction(formData: FormData) {
  const supabase = requireAdminClient();
  const seasonId = String(formData.get("season_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["setup", "active", "complete"].includes(status)) throw new Error("Invalid season status.");

  const { error } = await supabase.from("seasons").update({ status }).eq("id", seasonId);
  if (error) throw new Error(error.message);
  refreshApp();
}

export async function manualPointsAction(formData: FormData) {
  const supabase = requireAdminClient();
  const seasonId = String(formData.get("season_id") ?? "");
  const playerId = String(formData.get("player_id") ?? "");
  const points = Number(formData.get("points") ?? 0);

  const { data: current, error: currentError } = await supabase
    .from("standings")
    .select("*")
    .eq("season_id", seasonId)
    .eq("player_id", playerId)
    .single();
  if (currentError) throw new Error(currentError.message);

  const { error } = await supabase
    .from("standings")
    .update({
      pts: current.pts + points,
      bonus_pts: current.bonus_pts + points,
      updated_at: new Date().toISOString()
    })
    .eq("season_id", seasonId)
    .eq("player_id", playerId);
  if (error) throw new Error(error.message);
  refreshApp();
}

export async function recalculateStandings(seasonId: string) {
  const supabase = requireAdminClient();
  const [{ data: players, error: playersError }, { data: fixtures, error: fixturesError }] =
    await Promise.all([
      supabase.from("players").select("*"),
      supabase.from("fixtures").select("*").eq("season_id", seasonId)
    ]);

  if (playersError) throw new Error(playersError.message);
  if (fixturesError) throw new Error(fixturesError.message);

  const standings = calculateStandings(seasonId, players as Player[], fixtures as Fixture[]).map(
    ({ player, id, updated_at, ...standing }) => ({
      ...standing,
      updated_at: new Date().toISOString()
    })
  );

  if (standings.length === 0) return;

  const { error } = await supabase
    .from("standings")
    .upsert(standings, { onConflict: "season_id,player_id" });

  if (error) throw new Error(error.message);
}
