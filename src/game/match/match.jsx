import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
import {
  buildCompletedDayResults,
  buildSeasonFixtureDraws,
  getSimulationFixtureById,
  simulateCareerDay,
} from "../careerSimulation";
import {
  ensureCareerCardState,
  generateCardOfferSet,
  resolveFormWinsBucket,
  resolveLeagueTierFromCompetitionId,
} from "../cards";
import "./match.scss";

const Match = () => {
  const navigate = useNavigate();
  const { gameState, setGameState } = useGame();
  const [isResolving, setIsResolving] = useState(false);

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const careerWorld = gameState?.career?.world ?? null;
  const calendar = gameState?.career?.calendar ?? null;
  const seasons = Array.isArray(calendar?.seasons) ? calendar.seasons : [];
  const activeSeason = seasons.find((season) => season.id === calendar?.activeSeasonId) ?? seasons[0] ?? null;
  const currentDayIndex = Number.isInteger(calendar?.currentDayIndex) ? calendar.currentDayIndex : 0;
  const currentDay = activeSeason?.days?.[currentDayIndex] ?? null;
  const simulationState = calendar?.simulation ?? null;
  const cardsState = ensureCareerCardState(gameState?.career?.cards);
  const pendingPlayerFixtureId = simulationState?.pendingPlayerFixtureId ?? "";
  const pendingFixture = getSimulationFixtureById({
    simulationState,
    fixtureId: pendingPlayerFixtureId,
  });

  const resolvePlayerMatchResultLabel = (selectedResult) => {
    if (selectedResult === "draw") {
      return "Draw";
    }
    const isPlayerHome = pendingFixture?.homeTeamId === careerWorld?.playerTeam?.id;
    const isPlayerAway = pendingFixture?.awayTeamId === careerWorld?.playerTeam?.id;

    if (selectedResult === "home_win") {
      return isPlayerHome ? "Win" : "Lose";
    }
    if (selectedResult === "away_win") {
      return isPlayerAway ? "Win" : "Lose";
    }
    return "Lose";
  };

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || !careerWorld || !calendar || !activeSeason || !currentDay) {
    return <Navigate to="/career/start" replace />;
  }

  if (cardsState?.pendingRewardChoice) {
    return <Navigate to="/career/card-reward" replace />;
  }

  if (!pendingFixture) {
    return <Navigate to="/career/home" replace />;
  }

  const resolvePlayerFixture = (selectedResult) => {
    if (isResolving) {
      return;
    }
    setIsResolving(true);

    const simulationResult = simulateCareerDay({
      simulationState,
      careerWorld,
      currentDay,
      forcedPlayerResolution: {
        fixtureId: pendingPlayerFixtureId,
        selectedResult,
      },
    });

    const dayResults = buildCompletedDayResults({
      simulationState: simulationResult.nextSimulationState,
      currentDay,
    });
    const shouldRevealSeasonFixtures =
      currentDay.dayOfSeason === 1 && !calendar?.seasonFixturesRevealed;
    const seasonFixtureDraws = shouldRevealSeasonFixtures
      ? buildSeasonFixtureDraws({
          simulationState: simulationResult.nextSimulationState,
        })
      : [];
    const allCupDraws = [...simulationResult.createdCupDraws, ...seasonFixtureDraws];
    const shouldSuppressDayResultsPanel = currentDay.dayOfSeason === 1;
    const shouldShowDayResultsPanel = dayResults.length > 0 && !shouldSuppressDayResultsPanel;
    const playerTeamId = careerWorld?.playerTeam?.id ?? "";
    const rewardContext = {
      leagueTier: resolveLeagueTierFromCompetitionId(careerWorld?.playerTeam?.competitionId),
      formWins: resolveFormWinsBucket(
        simulationResult.nextSimulationState?.teamFormByTeamId?.[playerTeamId] ?? []
      ),
      matchResult: resolvePlayerMatchResultLabel(selectedResult),
    };
    const rewardOfferResult = generateCardOfferSet({
      context: rewardContext,
      source: "post_match",
    });

    setGameState((prev) => ({
      ...prev,
      career: {
        ...prev.career,
        calendar: {
          ...(prev.career?.calendar ?? {}),
          simulation: simulationResult.nextSimulationState,
          championsCupStructure: simulationResult.nextSimulationState?.cups?.competitions?.championsCup ?? {},
          debug: {
            ...(prev.career?.calendar?.debug ?? {}),
            simulation: simulationResult.nextSimulationState?.debug ?? {},
          },
          pendingCupDraw:
            allCupDraws.length > 0
              ? {
                  dayOfSeason: currentDay.dayOfSeason,
                  seasonWeekNumber: currentDay.seasonWeekNumber,
                  dayName: currentDay.dayName,
                  draws: allCupDraws,
                }
              : null,
          pendingDayResults: shouldShowDayResultsPanel
            ? {
                dayOfSeason: currentDay.dayOfSeason,
                seasonWeekNumber: currentDay.seasonWeekNumber,
                dayName: currentDay.dayName,
                results: dayResults,
                seasonFixtureReveal: [],
              }
            : null,
          seasonFixturesRevealed:
            Boolean(prev.career?.calendar?.seasonFixturesRevealed) || shouldRevealSeasonFixtures,
        },
        cards: {
          ...ensureCareerCardState(prev?.career?.cards),
          pendingRewardChoice: {
            source: "post_match",
            context: rewardOfferResult.context,
            rewardMatrixRow: rewardOfferResult.rewardMatrixRow,
            offeredCards: rewardOfferResult.offeredCards,
            rollDebug: rewardOfferResult.rollDebug,
            staffSubtypeRolls: rewardOfferResult.staffSubtypeRolls,
            rerollCount: 0,
            createdAt: new Date().toISOString(),
          },
          debug: {
            ...ensureCareerCardState(prev?.career?.cards).debug,
            lastRewardContext: rewardOfferResult.context,
            lastRewardMatrixRow: rewardOfferResult.rewardMatrixRow,
            lastRolls: rewardOfferResult.rollDebug,
            lastStaffSubtypeRolls: rewardOfferResult.staffSubtypeRolls,
            lastProceduralStaffCard: rewardOfferResult.proceduralStaffCards[0] ?? null,
            lastRewardSource: "post_match",
          },
          lastUpdatedAt: new Date().toISOString(),
        },
      },
    }));
    navigate("/career/card-reward");
  };

  return (
    <PageLayout
      title="Match Debug Resolution"
      subtitle="Temporary player match flow. Pick an outcome to resolve this fixture and continue career progression."
    >
      <section className="matchDebug">
        <article className="matchDebug__card">
          <h2>{pendingFixture.competitionName}</h2>
          <p className="matchDebug__meta">{pendingFixture.stageLabel}</p>
          <p className="matchDebug__meta">
            Week {currentDay.seasonWeekNumber} - {currentDay.dayName}
          </p>
          <div className="matchDebug__teams">
            <span>{pendingFixture.homeTeamName}</span>
            <span className="matchDebug__vs">vs</span>
            <span>{pendingFixture.awayTeamName}</span>
          </div>
        </article>

        <article className="matchDebug__card">
          <h3>Resolve Result</h3>
          <p className="matchDebug__note">
            One-click result entry for this epic. Scoreline is generated automatically to match your selected outcome.
          </p>
          <div className="matchDebug__actions">
            <Button
              variant={BUTTON_VARIANT.PRIMARY}
              onClick={() => resolvePlayerFixture("home_win")}
              disabled={isResolving}
            >
              Home Win
            </Button>
            <Button
              variant={BUTTON_VARIANT.SECONDARY}
              onClick={() => resolvePlayerFixture("draw")}
              disabled={isResolving}
            >
              Draw
            </Button>
            <Button
              variant={BUTTON_VARIANT.PRIMARY}
              onClick={() => resolvePlayerFixture("away_win")}
              disabled={isResolving}
            >
              Away Win
            </Button>
          </div>
        </article>
      </section>
    </PageLayout>
  );
};

export default Match;
