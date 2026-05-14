import type {
  Fixture,
  FixtureComment,
  FixtureReaction,
  Prediction,
  Season,
  Standing,
  TournamentData
} from "@/types";
import { attachPlayers } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { calculateStandings } from "@/lib/standings";

const unconfiguredSeason: Season = {
  id: "unconfigured",
  name: "FC26 Group Chat League",
  status: "setup",
  max_players: 12
};

function isMissingInteractionTable(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("fixture_comments") ||
    error?.message?.includes("fixture_reactions") ||
    error?.message?.includes("predictions")
  );
}

export async function getTournamentData(): Promise<TournamentData> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      season: unconfiguredSeason,
      players: [],
      fixtures: [],
      standings: [],
      comments: [],
      reactions: [],
      predictions: [],
      usingDemoData: true
    };
  }

  const { data: seasonData, error: seasonError } = await supabase
    .from("seasons")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (seasonError) throw new Error(seasonError.message);

  let season = seasonData as Season | null;
  if (!season) {
    const { data: inserted, error } = await supabase
      .from("seasons")
      .insert({ name: "FC26 Group Chat League", status: "setup" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    season = inserted as Season;
  }

  const [playersResponse, fixturesResponse, standingsResponse] = await Promise.all([
    supabase.from("players").select("*").order("created_at", { ascending: true }),
    supabase
      .from("fixtures")
      .select("*")
      .eq("season_id", season.id)
      .order("matchday", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("standings").select("*").eq("season_id", season.id)
  ]);

  if (playersResponse.error) throw new Error(playersResponse.error.message);
  if (fixturesResponse.error) throw new Error(fixturesResponse.error.message);
  if (standingsResponse.error) throw new Error(standingsResponse.error.message);

  const players = playersResponse.data ?? [];
  const fixtures = attachPlayers((fixturesResponse.data ?? []) as Fixture[], players);
  const fixtureIds = fixtures.map((fixture) => fixture.id);
  const manualBonuses = new Map<string, number>(
    ((standingsResponse.data ?? []) as Standing[]).map((standing) => [
      standing.player_id,
      standing.manual_bonus_pts ?? 0
    ])
  );
  const standings = calculateStandings(
    season.id,
    players,
    fixtures,
    manualBonuses,
    new Date(),
    season.created_at
  );

  let comments: FixtureComment[] = [];
  let reactions: FixtureReaction[] = [];
  let predictions: Prediction[] = [];

  if (fixtureIds.length) {
    const [commentsResponse, reactionsResponse, predictionsResponse] = await Promise.all([
      supabase
        .from("fixture_comments")
        .select("*")
        .in("fixture_id", fixtureIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("fixture_reactions")
        .select("*")
        .in("fixture_id", fixtureIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("predictions")
        .select("*")
        .in("fixture_id", fixtureIds)
        .order("created_at", { ascending: true })
    ]);

    const missingInteractionTables =
      isMissingInteractionTable(commentsResponse.error) ||
      isMissingInteractionTable(reactionsResponse.error) ||
      isMissingInteractionTable(predictionsResponse.error);

    if (missingInteractionTables) {
      return {
        season,
        players,
        fixtures,
        standings,
        comments: [],
        reactions: [],
        predictions: [],
        usingDemoData: false
      };
    }

    if (commentsResponse.error) throw new Error(commentsResponse.error.message);
    if (reactionsResponse.error) throw new Error(reactionsResponse.error.message);
    if (predictionsResponse.error) throw new Error(predictionsResponse.error.message);

    comments = ((commentsResponse.data ?? []) as FixtureComment[]).map((comment) => ({
      ...comment,
      player: players.find((player) => player.id === comment.player_id) ?? null
    }));
    reactions = ((reactionsResponse.data ?? []) as FixtureReaction[]).map((reaction) => ({
      ...reaction,
      player: players.find((player) => player.id === reaction.player_id) ?? null
    }));
    predictions = ((predictionsResponse.data ?? []) as Prediction[]).map((prediction) => ({
      ...prediction,
      player: players.find((player) => player.id === prediction.player_id) ?? null
    }));
  }

  return {
    season,
    players,
    fixtures,
    standings,
    comments,
    reactions,
    predictions,
    usingDemoData: false
  };
}
