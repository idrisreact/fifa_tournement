"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  getCurrentPlayer,
  getCurrentUser,
  requireAdminUser,
  requireFixtureParticipant
} from "@/lib/auth";
import { generateRoundRobin } from "@/lib/fixtures";
import { manualPointsSchema, scoreSchema, submissionSchema } from "@/lib/schemas";
import { calculateStandings } from "@/lib/standings";
import { AVATAR_COLORS } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Fixture, FixtureReactionType, Player } from "@/types";

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
  revalidatePath("/players/[id]", "page");
}

async function recordFixtureUpload(
  supabase: ReturnType<typeof requireAdminClient>,
  args: {
    file: File;
    fixtureId: string;
    seasonId: string;
    playerId: string;
    side: "home" | "away";
  }
) {
  const extension = args.file.name.split(".").pop() ?? "png";
  const path = `${args.seasonId}/${args.fixtureId}-${args.side}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("screenshots")
    .upload(path, args.file, { contentType: args.file.type, upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("screenshots").getPublicUrl(path);

  const { error: insertError } = await supabase.from("fixture_uploads").upsert(
    {
      fixture_id: args.fixtureId,
      player_id: args.playerId,
      side: args.side,
      storage_path: path,
      public_url: data.publicUrl,
      content_type: args.file.type || null,
      size_bytes: args.file.size
    },
    { onConflict: "fixture_id,player_id,side" }
  );
  if (insertError) throw new Error(insertError.message);
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

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase?.auth.signOut();
  revalidatePath("/admin");
}

export async function addPlayerAction(formData: FormData) {
  await requireAdminUser();
  const supabase = requireAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const psnTag = String(formData.get("psn_tag") ?? "").trim();

  if (!name || !psnTag) throw new Error("Name and PSN tag are required.");

  const [{ count }, { data: season }] = await Promise.all([
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase
      .from("seasons")
      .select("max_players")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);
  if (!season) throw new Error("No active season found.");
  const cap = season.max_players;
  if ((count ?? 0) >= cap) throw new Error(`The squad is already full (${cap} players).`);

  const avatarColor = AVATAR_COLORS[count ?? 0] ?? AVATAR_COLORS[0];
  const { error } = await supabase
    .from("players")
    .insert({ name, psn_tag: psnTag, avatar_color: avatarColor });

  if (error) throw new Error(error.message);
  refreshApp();
}

export async function removePlayerAction(formData: FormData) {
  await requireAdminUser();
  const supabase = requireAdminClient();
  const playerId = String(formData.get("player_id") ?? "");

  const { count } = await supabase.from("fixtures").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) throw new Error("Players can only be removed before fixtures are generated. Use Withdraw instead.");

  const { error } = await supabase.from("players").delete().eq("id", playerId);
  if (error) throw new Error(error.message);
  refreshApp();
}

export async function withdrawPlayerAction(formData: FormData) {
  await requireAdminUser();
  const supabase = requireAdminClient();
  const playerId = String(formData.get("player_id") ?? "");

  const { error: playerError } = await supabase
    .from("players")
    .update({ is_active: false })
    .eq("id", playerId);
  if (playerError) throw new Error(playerError.message);

  const { data: voidedFixtures, error: voidError } = await supabase
    .from("fixtures")
    .update({
      voided: true,
      home_submitted_home_score: null,
      home_submitted_away_score: null,
      home_submitted_at: null,
      away_submitted_home_score: null,
      away_submitted_away_score: null,
      away_submitted_at: null,
      dispute_open: false,
      dispute_reason: null
    })
    .eq("played", false)
    .or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`)
    .select("season_id");
  if (voidError) throw new Error(voidError.message);

  const seasonIds = Array.from(new Set((voidedFixtures ?? []).map((row) => row.season_id)));
  await Promise.all(seasonIds.map((id) => recalculateStandings(id)));

  refreshApp();
}

export async function reinstatePlayerAction(formData: FormData) {
  await requireAdminUser();
  const supabase = requireAdminClient();
  const playerId = String(formData.get("player_id") ?? "");

  const { error: playerError } = await supabase
    .from("players")
    .update({ is_active: true })
    .eq("id", playerId);
  if (playerError) throw new Error(playerError.message);

  const { data: restored, error: restoreError } = await supabase
    .from("fixtures")
    .update({ voided: false })
    .eq("voided", true)
    .eq("played", false)
    .or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`)
    .select("season_id");
  if (restoreError) throw new Error(restoreError.message);

  const seasonIds = Array.from(new Set((restored ?? []).map((row) => row.season_id)));
  await Promise.all(seasonIds.map((id) => recalculateStandings(id)));

  refreshApp();
}

export async function generateFixturesAction(formData: FormData) {
  await requireAdminUser();
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
  await requireAdminUser();
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

  let screenshotUrl: string | null = fixture.result_screenshot_url;
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
      played_at: new Date().toISOString(),
      home_submitted_home_score: null,
      home_submitted_away_score: null,
      home_submitted_at: null,
      away_submitted_home_score: null,
      away_submitted_away_score: null,
      away_submitted_at: null,
      dispute_open: false,
      dispute_reason: null,
      voided: false
    })
    .eq("id", parsed.fixtureId);

  if (error) throw new Error(error.message);
  await recalculateStandings(fixture.season_id);
  refreshApp();
}

export async function resetFixtureAction(formData: FormData) {
  await requireAdminUser();
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
      played_at: null,
      home_submitted_home_score: null,
      home_submitted_away_score: null,
      home_submitted_at: null,
      away_submitted_home_score: null,
      away_submitted_away_score: null,
      away_submitted_at: null,
      dispute_open: false,
      dispute_reason: null
    })
    .eq("id", fixtureId);
  if (error) throw new Error(error.message);

  const { error: uploadsError } = await supabase
    .from("fixture_uploads")
    .delete()
    .eq("fixture_id", fixtureId);
  if (uploadsError) throw new Error(uploadsError.message);

  await recalculateStandings(fixture.season_id);
  refreshApp();
}

export async function resetAllFixturesAction(formData: FormData) {
  await requireAdminUser();
  const supabase = requireAdminClient();
  const seasonId = String(formData.get("season_id") ?? "");
  if (!seasonId) throw new Error("Missing season id.");

  const { error: fixturesError } = await supabase
    .from("fixtures")
    .delete()
    .eq("season_id", seasonId);
  if (fixturesError) throw new Error(fixturesError.message);

  const { error: standingsError } = await supabase
    .from("standings")
    .delete()
    .eq("season_id", seasonId);
  if (standingsError) throw new Error(standingsError.message);

  const { error: statusError } = await supabase
    .from("seasons")
    .update({ status: "setup" })
    .eq("id", seasonId);
  if (statusError) throw new Error(statusError.message);

  refreshApp();
}

export async function updateSeasonStatusAction(formData: FormData) {
  await requireAdminUser();
  const supabase = requireAdminClient();
  const seasonId = String(formData.get("season_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["setup", "active", "complete"].includes(status)) throw new Error("Invalid season status.");

  const { error } = await supabase.from("seasons").update({ status }).eq("id", seasonId);
  if (error) throw new Error(error.message);
  refreshApp();
}

export async function updateSeasonMaxPlayersAction(formData: FormData) {
  await requireAdminUser();
  const supabase = requireAdminClient();
  const seasonId = String(formData.get("season_id") ?? "");
  const maxPlayers = Number(formData.get("max_players") ?? 0);

  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 20) {
    throw new Error("Squad size must be a whole number between 2 and 20.");
  }

  const [{ count: playerCount }, { count: fixtureCount }] = await Promise.all([
    supabase
      .from("players")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("fixtures")
      .select("*", { count: "exact", head: true })
      .eq("season_id", seasonId)
  ]);

  if ((playerCount ?? 0) > maxPlayers) {
    throw new Error(
      `Cannot shrink below current squad of ${playerCount}. Remove players first.`
    );
  }

  if ((fixtureCount ?? 0) > 0) {
    throw new Error(
      "Fixtures have already been generated. Adjust the squad before generating fixtures."
    );
  }

  const { error } = await supabase
    .from("seasons")
    .update({ max_players: maxPlayers })
    .eq("id", seasonId);
  if (error) throw new Error(error.message);
  refreshApp();
}

export async function manualPointsAction(formData: FormData) {
  await requireAdminUser();
  const supabase = requireAdminClient();
  const parsed = manualPointsSchema.parse({
    seasonId: formData.get("season_id"),
    playerId: formData.get("player_id"),
    points: formData.get("points"),
    reason: formData.get("reason") ?? ""
  });

  const { data: current, error: currentError } = await supabase
    .from("standings")
    .select("manual_bonus_pts")
    .eq("season_id", parsed.seasonId)
    .eq("player_id", parsed.playerId)
    .single();
  if (currentError) throw new Error(currentError.message);

  const nextManualBonus = (current.manual_bonus_pts ?? 0) + parsed.points;

  const { error } = await supabase
    .from("standings")
    .update({
      manual_bonus_pts: nextManualBonus,
      updated_at: new Date().toISOString()
    })
    .eq("season_id", parsed.seasonId)
    .eq("player_id", parsed.playerId);
  if (error) throw new Error(error.message);

  await recalculateStandings(parsed.seasonId);
  refreshApp();
}

const commentSchema = z.object({
  fixtureId: z.string().uuid(),
  body: z.string().trim().min(1).max(280)
});

const predictionSchema = z.object({
  fixtureId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99)
});

const reactionSchema = z.object({
  fixtureId: z.string().uuid(),
  reaction: z.enum(["fire", "shock", "laugh", "respect"])
});

export async function claimPlayerAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in to claim a squad name.");

  const playerId = String(formData.get("player_id") ?? "");
  if (!playerId) throw new Error("Pick a squad name.");

  const supabase = requireAdminClient();

  const { data: existingForUser } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (existingForUser) throw new Error("You are already linked to a squad name.");

  const { data: updated, error } = await supabase
    .from("players")
    .update({ auth_user_id: user.id })
    .eq("id", playerId)
    .is("auth_user_id", null)
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated?.length) throw new Error("That squad name is already taken.");

  refreshApp();
}

export async function selfRegisterPlayerAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in to register.");

  const name = String(formData.get("name") ?? "").trim();
  const psnTag = String(formData.get("psn_tag") ?? "").trim();
  if (!name || !psnTag) throw new Error("Name and PSN tag are required.");

  const supabase = requireAdminClient();

  const { data: existingForUser } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (existingForUser) throw new Error("You are already linked to a squad name.");

  const { count: fixtureCount } = await supabase
    .from("fixtures")
    .select("*", { count: "exact", head: true });
  if ((fixtureCount ?? 0) > 0) {
    throw new Error("Fixtures have already been generated. Ask the admin to add you.");
  }

  const [{ count: playerCount }, { data: season }] = await Promise.all([
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase
      .from("seasons")
      .select("max_players")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);
  if (!season) throw new Error("No active season found.");
  const cap = season.max_players;
  if ((playerCount ?? 0) >= cap) throw new Error(`The squad is already full (${cap} players).`);

  const avatarColor = AVATAR_COLORS[playerCount ?? 0] ?? AVATAR_COLORS[0];

  const { error } = await supabase
    .from("players")
    .insert({ name, psn_tag: psnTag, avatar_color: avatarColor, auth_user_id: user.id });
  if (error) throw new Error(error.message);

  refreshApp();
}

export async function releasePlayerLinkAction(formData: FormData) {
  await requireAdminUser();
  const playerId = String(formData.get("player_id") ?? "");
  const supabase = requireAdminClient();
  const { error } = await supabase
    .from("players")
    .update({ auth_user_id: null })
    .eq("id", playerId);
  if (error) throw new Error(error.message);
  refreshApp();
}

export type SubmitResultStatus = "pending" | "confirmed" | "dispute";

export async function submitResultAction(formData: FormData): Promise<{ status: SubmitResultStatus }> {
  const parsed = submissionSchema.parse({
    fixtureId: formData.get("fixture_id"),
    homeScore: formData.get("home_score"),
    awayScore: formData.get("away_score")
  });

  const { role, player, fixture } = await requireFixtureParticipant(parsed.fixtureId);
  const supabase = requireAdminClient();

  const { data: current, error: fetchError } = await supabase
    .from("fixtures")
    .select("*")
    .eq("id", fixture.id)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (current.played) throw new Error("This fixture is already final.");
  if (current.voided) throw new Error("This fixture is voided.");
  if (current.dispute_open) throw new Error("This fixture is disputed. Wait for an admin to resolve it.");

  const sidePrefix = role === "home" ? "home" : "away";
  const otherPrefix = role === "home" ? "away" : "home";

  const alreadySubmittedAt = current[`${sidePrefix}_submitted_at`];
  if (alreadySubmittedAt) {
    throw new Error("You have already submitted a score for this fixture.");
  }

  const screenshot = formData.get("screenshot");
  if (screenshot instanceof File && screenshot.size > 0) {
    await recordFixtureUpload(supabase, {
      file: screenshot,
      fixtureId: fixture.id,
      seasonId: fixture.season_id,
      playerId: player.id,
      side: role
    });
  }

  const otherHome = current[`${otherPrefix}_submitted_home_score`];
  const otherAway = current[`${otherPrefix}_submitted_away_score`];
  const otherSubmittedAt = current[`${otherPrefix}_submitted_at`];

  const updatePayload: Record<string, unknown> = {
    [`${sidePrefix}_submitted_home_score`]: parsed.homeScore,
    [`${sidePrefix}_submitted_away_score`]: parsed.awayScore,
    [`${sidePrefix}_submitted_at`]: new Date().toISOString()
  };

  let status: SubmitResultStatus = "pending";

  if (otherSubmittedAt !== null && otherSubmittedAt !== undefined) {
    const matches = otherHome === parsed.homeScore && otherAway === parsed.awayScore;
    if (matches) {
      updatePayload.home_score = parsed.homeScore;
      updatePayload.away_score = parsed.awayScore;
      updatePayload.played = true;
      updatePayload.played_at = new Date().toISOString();
      updatePayload.dispute_open = false;
      updatePayload.dispute_reason = null;
      status = "confirmed";
    } else {
      updatePayload.dispute_open = true;
      updatePayload.dispute_reason = `Submissions disagree: home claims ${
        role === "home" ? `${parsed.homeScore}-${parsed.awayScore}` : `${otherHome}-${otherAway}`
      }, away claims ${
        role === "away" ? `${parsed.homeScore}-${parsed.awayScore}` : `${otherHome}-${otherAway}`
      }.`;
      status = "dispute";
    }
  }

  const { error: updateError } = await supabase
    .from("fixtures")
    .update(updatePayload)
    .eq("id", fixture.id);
  if (updateError) throw new Error(updateError.message);

  if (updatePayload.played) {
    await recalculateStandings(fixture.season_id);
  }
  refreshApp();
  return { status };
}

export async function clearSubmissionsAction(formData: FormData) {
  await requireAdminUser();
  const fixtureId = String(formData.get("fixture_id") ?? "");
  const supabase = requireAdminClient();
  const { error } = await supabase
    .from("fixtures")
    .update({
      home_submitted_home_score: null,
      home_submitted_away_score: null,
      home_submitted_at: null,
      away_submitted_home_score: null,
      away_submitted_away_score: null,
      away_submitted_at: null,
      dispute_open: false,
      dispute_reason: null
    })
    .eq("id", fixtureId);
  if (error) throw new Error(error.message);

  const { error: uploadsError } = await supabase
    .from("fixture_uploads")
    .delete()
    .eq("fixture_id", fixtureId);
  if (uploadsError) throw new Error(uploadsError.message);

  refreshApp();
}

export async function addFixtureCommentAction(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) throw new Error("Sign in and claim a squad name to comment.");

  const parsed = commentSchema.parse({
    fixtureId: formData.get("fixture_id"),
    body: String(formData.get("body") ?? "")
  });

  const supabase = requireAdminClient();
  const { error } = await supabase.from("fixture_comments").insert({
    fixture_id: parsed.fixtureId,
    player_id: player.id,
    body: parsed.body
  });
  if (error) throw new Error(error.message);
  refreshApp();
}

export async function toggleFixtureReactionAction(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) throw new Error("Sign in and claim a squad name to react.");

  const parsed = reactionSchema.parse({
    fixtureId: formData.get("fixture_id"),
    reaction: formData.get("reaction")
  });

  const supabase = requireAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("fixture_reactions")
    .select("id")
    .eq("fixture_id", parsed.fixtureId)
    .eq("player_id", player.id)
    .eq("reaction", parsed.reaction)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  const reaction = parsed.reaction as FixtureReactionType;
  if (existing) {
    const { error } = await supabase.from("fixture_reactions").delete().eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("fixture_reactions").insert({
      fixture_id: parsed.fixtureId,
      player_id: player.id,
      reaction
    });
    if (error) throw new Error(error.message);
  }
  refreshApp();
}

export async function upsertPredictionAction(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) throw new Error("Sign in and claim a squad name to predict scores.");

  const parsed = predictionSchema.parse({
    fixtureId: formData.get("fixture_id"),
    homeScore: formData.get("home_score"),
    awayScore: formData.get("away_score")
  });

  const supabase = requireAdminClient();
  const { data: fixture, error: fixtureError } = await supabase
    .from("fixtures")
    .select("played, voided")
    .eq("id", parsed.fixtureId)
    .single();
  if (fixtureError) throw new Error(fixtureError.message);
  if (fixture.played) throw new Error("Predictions are locked once a fixture is played.");
  if (fixture.voided) throw new Error("Predictions are closed for voided fixtures.");

  const { error } = await supabase.from("predictions").upsert(
    {
      fixture_id: parsed.fixtureId,
      player_id: player.id,
      home_score: parsed.homeScore,
      away_score: parsed.awayScore,
      updated_at: new Date().toISOString()
    },
    { onConflict: "fixture_id,player_id" }
  );
  if (error) throw new Error(error.message);
  refreshApp();
}

export async function recalculateStandings(seasonId: string) {
  const supabase = requireAdminClient();
  const [
    { data: season, error: seasonError },
    { data: players, error: playersError },
    { data: fixtures, error: fixturesError },
    { data: existingStandings, error: existingError }
  ] = await Promise.all([
    supabase.from("seasons").select("created_at").eq("id", seasonId).single(),
    supabase.from("players").select("*"),
    supabase.from("fixtures").select("*").eq("season_id", seasonId),
    supabase
      .from("standings")
      .select("player_id, manual_bonus_pts")
      .eq("season_id", seasonId)
  ]);

  if (seasonError) throw new Error(seasonError.message);
  if (playersError) throw new Error(playersError.message);
  if (fixturesError) throw new Error(fixturesError.message);
  if (existingError) throw new Error(existingError.message);

  const manualBonuses = new Map<string, number>(
    (existingStandings ?? []).map((row) => [row.player_id, row.manual_bonus_pts ?? 0])
  );

  const standings = calculateStandings(
    seasonId,
    players as Player[],
    fixtures as Fixture[],
    manualBonuses,
    new Date(),
    season.created_at
  ).map(({ player, id, updated_at, ...standing }) => ({
    ...standing,
    updated_at: new Date().toISOString()
  }));

  if (standings.length === 0) return;

  const { error } = await supabase
    .from("standings")
    .upsert(standings, { onConflict: "season_id,player_id" });

  if (error) throw new Error(error.message);
}
