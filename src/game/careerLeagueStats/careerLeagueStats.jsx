import { Navigate } from "react-router-dom";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import { useGame } from "../../engine/gameContext/gameContext";
import { DOMESTIC_LEAGUE_IDS, LEAGUE_ID_TO_NAME } from "../careerSimulation/constants/simulationConstants";
import PlayerStatTables from "../careerStats/components/playerStatTables";
import PageLayout from "../shared/pageLayout/pageLayout";
import "./careerLeagueStats.scss";

const CareerLeagueStats = () => {
  const { gameState } = useGame();

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const calendar = gameState?.career?.calendar ?? null;
  const simulation = calendar?.simulation ?? null;
  const leagueTablesByCompetition = simulation?.playerStats?.leagueTablesByCompetition ?? {};

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || !calendar || !simulation) {
    return <Navigate to="/career/start" replace />;
  }

  return (
    <PageLayout
      title="League Stats"
      subtitle="Track league top scorers, assists, and clean sheets across all domestic divisions."
    >
      <section className="careerLeagueStats">
        <article className="careerLeagueStats__actions">
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/career/home">
            Back to Calendar
          </Button>
        </article>

        {DOMESTIC_LEAGUE_IDS.map((competitionId) => (
          <article key={competitionId} className="careerLeagueStats__competitionCard">
            <header className="careerLeagueStats__competitionHeader">
              <h2>{LEAGUE_ID_TO_NAME[competitionId] ?? competitionId}</h2>
            </header>
            <PlayerStatTables
              tables={leagueTablesByCompetition?.[competitionId] ?? null}
              emptyText="No league stats recorded yet."
            />
          </article>
        ))}
      </section>
    </PageLayout>
  );
};

export default CareerLeagueStats;
