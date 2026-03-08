import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
import { buildCareerCalendarState } from "../careerCalendar";
import { DOMESTIC_LEAGUE_IDS, LEAGUE_ID_TO_NAME } from "../careerSimulation/constants/simulationConstants";
import { buildNextCareerWorldFromSeasonOutcomes } from "./utils/seasonTransition";
import "./careerSeasonSummary.scss";

const buildTeamLookup = (careerWorld) => {
  const lookup = {};
  const competitions = Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : [];

  competitions.forEach((competition) => {
    (competition.teams ?? []).forEach((team) => {
      lookup[team.id] = team.teamName ?? team.id;
    });
  });

  const playerTeam = careerWorld?.playerTeam ?? null;
  if (playerTeam?.id) {
    lookup[playerTeam.id] = playerTeam.teamName ?? playerTeam.id;
  }

  return lookup;
};

const resolveTeamName = (teamId, teamLookup) => {
  if (!teamId) {
    return "TBD";
  }
  return teamLookup[teamId] ?? teamId;
};

const CareerSeasonSummary = () => {
  const navigate = useNavigate();
  const { gameState, setGameState } = useGame();
  const [isStartingNextSeason, setIsStartingNextSeason] = useState(false);

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const careerWorld = gameState?.career?.world ?? null;
  const calendar = gameState?.career?.calendar ?? null;
  const seasons = Array.isArray(calendar?.seasons) ? calendar.seasons : [];
  const activeSeason = seasons.find((season) => season.id === calendar?.activeSeasonId) ?? seasons[0] ?? null;
  const rawCurrentDayIndex = Number.isInteger(calendar?.currentDayIndex) ? calendar.currentDayIndex : 0;
  const isSeasonComplete = activeSeason ? rawCurrentDayIndex >= activeSeason.totalDays - 1 : false;
  const simulationState = calendar?.simulation ?? null;
  const seasonOutcomes = simulationState?.seasonOutcomes ?? null;
  const teamLookup = useMemo(() => buildTeamLookup(careerWorld), [careerWorld]);

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || !careerWorld || !calendar || !activeSeason) {
    return <Navigate to="/career/start" replace />;
  }

  if (!isSeasonComplete) {
    return <Navigate to="/career/home" replace />;
  }

  const leagueTables = simulationState?.league?.tablesByCompetition ?? {};
  const leagueSummary = DOMESTIC_LEAGUE_IDS.map((competitionId) => {
    const winnerTeamId = leagueTables?.[competitionId]?.entries?.[0]?.teamId ?? "";
    return {
      competitionId,
      competitionName: LEAGUE_ID_TO_NAME[competitionId] ?? competitionId,
      winnerTeamName: resolveTeamName(winnerTeamId, teamLookup),
    };
  });

  const leagueCupWinnerId = simulationState?.cups?.competitions?.leagueCup?.championTeamId ?? "";
  const championsCupWinnerId = simulationState?.cups?.competitions?.championsCup?.championTeamId ?? "";
  const movementRows = DOMESTIC_LEAGUE_IDS.map((competitionId) => {
    const promoted = Array.isArray(seasonOutcomes?.leagues?.[competitionId]?.promoted)
      ? seasonOutcomes.leagues[competitionId].promoted
      : [];
    const relegated = Array.isArray(seasonOutcomes?.leagues?.[competitionId]?.relegated)
      ? seasonOutcomes.leagues[competitionId].relegated
      : [];

    return {
      competitionId,
      competitionName: LEAGUE_ID_TO_NAME[competitionId] ?? competitionId,
      promoted: promoted.map((teamId) => resolveTeamName(teamId, teamLookup)),
      relegated: relegated.map((teamId) => resolveTeamName(teamId, teamLookup)),
    };
  }).filter((row) => row.promoted.length > 0 || row.relegated.length > 0);

  const startNextSeason = () => {
    if (isStartingNextSeason || !seasonOutcomes?.resolved) {
      return;
    }

    setIsStartingNextSeason(true);

    const nextCareerWorld = buildNextCareerWorldFromSeasonOutcomes({
      careerWorld,
      seasonOutcomes,
    });
    const nextCalendarState = buildCareerCalendarState({
      careerWorld: nextCareerWorld,
    });

    setGameState((prev) => ({
      ...prev,
      career: {
        ...prev.career,
        world: nextCareerWorld,
        calendar: {
          ...(prev.career?.calendar ?? {}),
          status: "ready",
          sourceGeneratedAt: nextCareerWorld?.generatedAt ?? "",
          seasons: nextCalendarState.seasons,
          activeSeasonId: nextCalendarState.activeSeasonId,
          currentDayIndex: nextCalendarState.currentDayIndex,
          visibleMonthIndex: nextCalendarState.visibleMonthIndex,
          pendingFlashDayIndex: null,
          pendingDayResults: null,
          pendingCupDraw: null,
          seasonFixturesRevealed: Boolean(nextCalendarState.seasonFixturesRevealed),
          lastAdvancedAt: "",
          championsCupStructure: nextCalendarState.championsCupStructure,
          simulation: nextCalendarState.simulation,
          debug: nextCalendarState.debug,
        },
      },
    }));

    navigate("/career/home");
  };

  return (
    <PageLayout
      title="Season Summary"
      subtitle="Review league and cup outcomes before starting the next season."
    >
      <section className="careerSeasonSummary">
        <article className="careerSeasonSummary__panel">
          <h2>League Winners</h2>
          {leagueSummary.map((row) => (
            <p key={row.competitionId}>
              <strong>{row.competitionName}:</strong> {row.winnerTeamName}
            </p>
          ))}
        </article>

        <article className="careerSeasonSummary__panel">
          <h2>Cup Winners</h2>
          <p>
            <strong>League Cup:</strong> {resolveTeamName(leagueCupWinnerId, teamLookup)}
          </p>
          <p>
            <strong>Champions Cup:</strong> {resolveTeamName(championsCupWinnerId, teamLookup)}
          </p>
        </article>

        <article className="careerSeasonSummary__panel">
          <h2>Promotions and Relegations</h2>
          {movementRows.length === 0 ? (
            <p>No movement data available.</p>
          ) : (
            movementRows.map((row) => (
              <div key={row.competitionId} className="careerSeasonSummary__movementRow">
                <h3>{row.competitionName}</h3>
                <p>
                  <strong>Promoted:</strong>{" "}
                  {row.promoted.length > 0 ? row.promoted.join(", ") : "None"}
                </p>
                <p>
                  <strong>Relegated:</strong>{" "}
                  {row.relegated.length > 0 ? row.relegated.join(", ") : "None"}
                </p>
              </div>
            ))
          )}
        </article>

        <article className="careerSeasonSummary__actions">
          <Button
            variant={BUTTON_VARIANT.PRIMARY}
            onClick={startNextSeason}
            disabled={isStartingNextSeason || !seasonOutcomes?.resolved}
          >
            {isStartingNextSeason ? "Starting Next Season..." : "Start New Season"}
          </Button>
          <Button variant={BUTTON_VARIANT.SECONDARY} onClick={() => navigate("/career/home")}>
            Back to Career Home
          </Button>
        </article>
      </section>
    </PageLayout>
  );
};

export default CareerSeasonSummary;
