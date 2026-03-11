import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import { useGame } from "../../engine/gameContext/gameContext";
import LeagueTablePanel, { LEAGUE_TABLE_VARIANT } from "../careerCalendar/components/leagueTablePanel";
import { DOMESTIC_LEAGUE_IDS, LEAGUE_ID_TO_NAME } from "../careerSimulation/constants/simulationConstants";
import PlayerStatTables from "../careerStats/components/playerStatTables";
import PageLayout from "../shared/pageLayout/pageLayout";
import "./careerLeagueStats.scss";

const CareerLeagueStats = () => {
  const { gameState } = useGame();

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const calendar = gameState?.career?.calendar ?? null;
  const simulation = calendar?.simulation ?? null;
  const careerWorld = gameState?.career?.world ?? null;
  const competitions = useMemo(
    () => (Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : []),
    [careerWorld]
  );
  const teamLookupById = useMemo(() => {
    const lookup = {};
    competitions.forEach((competition) => {
      (competition?.teams ?? []).forEach((team) => {
        lookup[team.id] = {
          ...team,
          competitionId: competition.id,
          competitionName: competition.name,
        };
      });
    });

    if (careerWorld?.playerTeam?.id) {
      lookup[careerWorld.playerTeam.id] = {
        ...careerWorld.playerTeam,
        competitionId: careerWorld.playerTeam.competitionId ?? "league-5",
        competitionName: careerWorld.playerTeam.competitionName ?? "League 5",
        isPlayerTeam: true,
      };
    }

    return lookup;
  }, [careerWorld, competitions]);
  const initialLeagueId = DOMESTIC_LEAGUE_IDS.includes(careerWorld?.playerTeam?.competitionId)
    ? careerWorld.playerTeam.competitionId
    : DOMESTIC_LEAGUE_IDS[0];
  const [selectedLeagueId, setSelectedLeagueId] = useState(initialLeagueId);
  const leagueTablesByCompetition = simulation?.playerStats?.leagueTablesByCompetition ?? {};
  const activeLeagueId = DOMESTIC_LEAGUE_IDS.includes(selectedLeagueId)
    ? selectedLeagueId
    : initialLeagueId;
  const activeLeagueTable = simulation?.league?.tablesByCompetition?.[activeLeagueId] ?? null;
  const activePlayerStatTables = leagueTablesByCompetition?.[activeLeagueId] ?? null;
  const isDev = Boolean(import.meta.env.DEV);
  const activeDebugCounts = {
    tableRows: Array.isArray(activeLeagueTable?.entries) ? activeLeagueTable.entries.length : 0,
    topScorers: Array.isArray(activePlayerStatTables?.topScorers) ? activePlayerStatTables.topScorers.length : 0,
    topAssists: Array.isArray(activePlayerStatTables?.topAssists) ? activePlayerStatTables.topAssists.length : 0,
    cleanSheets: Array.isArray(activePlayerStatTables?.cleanSheets) ? activePlayerStatTables.cleanSheets.length : 0,
  };

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || !calendar || !simulation) {
    return <Navigate to="/career/start" replace />;
  }

  return (
    <PageLayout
      title="League Stats"
      subtitle="Inspect one league at a time with full standings and key player stat leaders."
    >
      <section className="careerLeagueStats">
        <article className="careerLeagueStats__actions">
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/career/home">
            Back to Calendar
          </Button>
        </article>

        <nav className="careerLeagueStats__tabs" aria-label="League tabs">
          {DOMESTIC_LEAGUE_IDS.map((competitionId) => {
            const isActive = competitionId === activeLeagueId;
            const buttonClassName = isActive
              ? "careerLeagueStats__tabButton careerLeagueStats__tabButton--active"
              : "careerLeagueStats__tabButton";

            return (
              <button
                key={competitionId}
                type="button"
                className={buttonClassName}
                onClick={() => setSelectedLeagueId(competitionId)}
                aria-pressed={isActive}
              >
                {LEAGUE_ID_TO_NAME[competitionId] ?? competitionId}
              </button>
            );
          })}
        </nav>

        <article className="careerLeagueStats__tabPanel">
          <LeagueTablePanel
            variant={LEAGUE_TABLE_VARIANT.DETAILED}
            title={`${LEAGUE_ID_TO_NAME[activeLeagueId] ?? activeLeagueId} Standings`}
            tablesByCompetition={simulation?.league?.tablesByCompetition ?? {}}
            selectedCompetitionId={activeLeagueId}
            defaultCompetitionId={activeLeagueId}
            showCompetitionSelector={false}
            playerTeamId={careerWorld?.playerTeam?.id ?? ""}
            teamLookupById={teamLookupById}
            teamFormByTeamId={simulation?.teamFormByTeamId ?? {}}
          />

          <section className="careerLeagueStats__statsBlock">
            <PlayerStatTables
              tables={activePlayerStatTables}
              emptyText="No league stats recorded yet."
              columns={3}
            />
          </section>
        </article>

        {isDev ? (
          <aside className="careerLeagueStats__debug" aria-live="polite">
            <p>
              Debug: Selected league <strong>{activeLeagueId}</strong>
            </p>
            <p>
              Table rows: {activeDebugCounts.tableRows} | Top Scorers: {activeDebugCounts.topScorers} | Top Assists:{" "}
              {activeDebugCounts.topAssists} | Clean Sheets: {activeDebugCounts.cleanSheets}
            </p>
          </aside>
        ) : null}
      </section>
    </PageLayout>
  );
};

export default CareerLeagueStats;
