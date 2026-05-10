import type { Fixture, Season, Standing, TournamentData } from "@/types";
import { attachPlayers } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase";

const unconfiguredSeason: Season = {
  id: "unconfigured",
  name: "FC25 Group Chat League",
  status: "setup"
};

export async function getTournamentData(): Promise<TournamentData> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      season: unconfiguredSeason,
      players: [],
      fixtures: [],
      standings: [],
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
      .insert({ name: "FC25 Group Chat League", status: "setup" })
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
  const standings = ((standingsResponse.data ?? []) as Standing[]).map((standing) => ({
    ...standing,
    player: players.find((player) => player.id === standing.player_id) ?? null
  }));

  return {
    season,
    players,
    fixtures,
    standings,
    usingDemoData: false
  };
}
