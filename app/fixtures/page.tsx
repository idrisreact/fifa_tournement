import { getCurrentPlayer, isAdminUser } from "@/lib/auth";
import { getTournamentData } from "@/lib/data";
import { FixturesClient } from "@/components/FixturesClient";
import { PageHeader } from "@/components/PageHeader";

export default async function FixturesPage() {
  const [{ players, fixtures, comments, reactions, predictions, usingDemoData }, isAdmin, currentPlayer] = await Promise.all([
    getTournamentData(),
    isAdminUser(),
    getCurrentPlayer()
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Match schedule"
        title="Fixtures"
        description="Filter by status, jump into a matchday, and submit results with proof."
      />
      <FixturesClient
        players={players}
        fixtures={fixtures}
        usingDemoData={usingDemoData}
        isAdmin={isAdmin}
        currentPlayerId={currentPlayer?.id ?? null}
        comments={comments}
        reactions={reactions}
        predictions={predictions}
      />
    </div>
  );
}
