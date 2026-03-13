import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
import { getMonthIndexFromDayIndex } from "../careerCalendar/utils/calendarModel";
import { ensureCareerCardState, normalizeCareerDayNumber, pruneExpiredStaffMemberCards } from "../cards";
import {
  getContinueFlowLabel,
  resolveDayResultsContinueAction,
} from "../careerFlow/utils/continueFlow";
import { resolveDayOneSetupGateState } from "../careerFlow/utils/dayOneSetupGate";
import "./careerDayResults.scss";

const LEAGUE_SORT_ORDER = Object.freeze({
  "league-1": 1,
  "league-2": 2,
  "league-3": 3,
  "league-4": 4,
  "league-5": 5,
});

const formatScore = (result) => {
  const base = `${result.homeGoals} - ${result.awayGoals}`;
  return result.decidedBy === "penalties" ? `${base} (pens)` : base;
};

const formatMatchRating = (ratingValue) => {
  const safeValue = Number(ratingValue);
  return Number.isFinite(safeValue) ? Math.max(0, Math.round(safeValue)) : 0;
};

const formatGoalEventLine = (goalEvent) => {
  const minute = Math.max(1, Math.min(90, Number(goalEvent?.minute) || 1));
  const teamName = String(goalEvent?.teamName ?? "").trim();
  const scorerName = String(goalEvent?.scorerName ?? "Unknown Scorer").trim();
  const assisterName = String(goalEvent?.assisterName ?? "").trim();
  const assistSuffix = assisterName ? ` (Assist: ${assisterName})` : "";

  return `${minute}' ${teamName ? `${teamName} - ` : ""}${scorerName}${assistSuffix}`;
};

const normaliseTeamName = (teamName) => String(teamName ?? "").trim().toLowerCase();

const isPlayerFixtureTeam = ({ fixtureTeamId, fixtureTeamName, playerTeamId, playerTeamName }) => {
  if (playerTeamId && fixtureTeamId) {
    return fixtureTeamId === playerTeamId;
  }

  if (!playerTeamName) {
    return false;
  }

  return normaliseTeamName(fixtureTeamName) === normaliseTeamName(playerTeamName);
};

const buildMatchDayGroups = (fixtures) => {
  const grouped = fixtures.reduce((state, fixture) => {
    const matchDay = Number(fixture?.roundNumber) || 0;
    if (!state[matchDay]) {
      state[matchDay] = [];
    }
    state[matchDay].push(fixture);
    return state;
  }, {});

  return Object.entries(grouped)
    .map(([matchDay, groupedFixtures]) => ({
      matchDay: Number(matchDay),
      fixtures: [...groupedFixtures].sort((leftFixture, rightFixture) => {
        const homeNameDelta = String(leftFixture.homeTeamName).localeCompare(
          String(rightFixture.homeTeamName)
        );
        if (homeNameDelta !== 0) {
          return homeNameDelta;
        }
        return String(leftFixture.awayTeamName).localeCompare(String(rightFixture.awayTeamName));
      }),
    }))
    .sort((leftGroup, rightGroup) => leftGroup.matchDay - rightGroup.matchDay);
};

const buildCompetitionResultGroups = (results) => {
  const grouped = results.reduce((state, result) => {
    const competitionName = String(result?.competitionName ?? "Unknown Competition");
    if (!state[competitionName]) {
      state[competitionName] = [];
    }
    state[competitionName].push(result);
    return state;
  }, {});

  return Object.entries(grouped)
    .map(([competitionName, groupedResults]) => ({
      competitionName,
      results: [...groupedResults].sort((leftResult, rightResult) =>
        String(leftResult.homeTeamName).localeCompare(String(rightResult.homeTeamName))
      ),
    }))
    .sort((leftGroup, rightGroup) =>
      String(leftGroup.competitionName).localeCompare(String(rightGroup.competitionName))
    );
};

const CareerDayResults = () => {
  const navigate = useNavigate();
  const { gameState, setGameState } = useGame();

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const careerWorld = gameState?.career?.world ?? null;
  const calendar = gameState?.career?.calendar ?? null;
  const seasons = Array.isArray(calendar?.seasons) ? calendar.seasons : [];
  const activeSeason = seasons.find((season) => season.id === calendar?.activeSeasonId) ?? seasons[0] ?? null;
  const pendingDayResults = calendar?.pendingDayResults ?? null;
  const cardsState = ensureCareerCardState(gameState?.career?.cards);
  const [expandedLeagueId, setExpandedLeagueId] = useState(null);

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || !calendar || !activeSeason) {
    return <Navigate to="/career/start" replace />;
  }

  if (cardsState?.pendingRewardChoice) {
    return <Navigate to="/career/card-reward" replace />;
  }

  if (!pendingDayResults) {
    return <Navigate to="/career/home" replace />;
  }

  const results = Array.isArray(pendingDayResults.results) ? pendingDayResults.results : [];
  const resultsByCompetition = buildCompetitionResultGroups(results);
  const seasonFixtureReveal = Array.isArray(pendingDayResults.seasonFixtureReveal)
    ? pendingDayResults.seasonFixtureReveal
    : [];
  const sortedSeasonFixtureReveal = [...seasonFixtureReveal].sort((leftLeague, rightLeague) => {
    const leftOrder = LEAGUE_SORT_ORDER[leftLeague.competitionId] ?? 99;
    const rightOrder = LEAGUE_SORT_ORDER[rightLeague.competitionId] ?? 99;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return String(leftLeague.competitionName).localeCompare(String(rightLeague.competitionName));
  });
  const playerTeamId = careerWorld?.playerTeam?.id ?? "";
  const playerTeamName = careerWorld?.playerTeam?.teamName ?? "";
  const playerLeagueId = careerWorld?.playerTeam?.competitionId ?? "league-5";
  const defaultExpandedLeagueId = sortedSeasonFixtureReveal.some(
    (leagueGroup) => leagueGroup.competitionId === playerLeagueId
  )
    ? playerLeagueId
    : sortedSeasonFixtureReveal[0]?.competitionId ?? "";
  const effectiveExpandedLeagueId = (() => {
    if (expandedLeagueId === null) {
      return defaultExpandedLeagueId;
    }

    if (expandedLeagueId === "") {
      return "";
    }

    return sortedSeasonFixtureReveal.some((leagueGroup) => leagueGroup.competitionId === expandedLeagueId)
      ? expandedLeagueId
      : defaultExpandedLeagueId;
  })();
  const rawCurrentDayIndex = Number.isInteger(calendar.currentDayIndex) ? calendar.currentDayIndex : 0;
  const currentCareerDayNumber = normalizeCareerDayNumber(calendar?.careerDayNumber);
  const isSeasonComplete = rawCurrentDayIndex >= activeSeason.totalDays - 1;
  const currentDay = activeSeason?.days?.[rawCurrentDayIndex] ?? null;
  const dayOneSetupGateState = resolveDayOneSetupGateState({
    currentDay,
    playerTeam: careerWorld?.playerTeam ?? null,
  });
  const continueAction = resolveDayResultsContinueAction({
    isDayOneSetupGateActive: dayOneSetupGateState.isGateActive,
  });
  const continueButtonLabel = getContinueFlowLabel(continueAction);

  const continueToNextDay = () => {
    if (dayOneSetupGateState.isGateActive) {
      setGameState((prev) => ({
        ...prev,
        career: {
          ...prev.career,
          calendar: {
            ...(prev.career?.calendar ?? {}),
            pendingDayResults: null,
          },
        },
      }));

      navigate("/team-management");
      return;
    }

    const nextDayIndex = isSeasonComplete ? rawCurrentDayIndex : rawCurrentDayIndex + 1;
    const nextVisibleMonthIndex = getMonthIndexFromDayIndex(nextDayIndex);
    const nextCareerDayNumber = isSeasonComplete
      ? currentCareerDayNumber
      : currentCareerDayNumber + 1;

    setGameState((prev) => {
      const expiryResult = pruneExpiredStaffMemberCards({
        cardsState: prev?.career?.cards,
        currentCareerDay: nextCareerDayNumber,
      });

      return {
        ...prev,
        career: {
          ...prev.career,
          calendar: {
            ...(prev.career?.calendar ?? {}),
            currentDayIndex: nextDayIndex,
            careerDayNumber: nextCareerDayNumber,
            visibleMonthIndex: nextVisibleMonthIndex,
            pendingDayResults: null,
            seasonFixturesRevealed:
              Boolean(prev.career?.calendar?.seasonFixturesRevealed) || seasonFixtureReveal.length > 0,
            pendingFlashDayIndex: null,
            lastAdvancedAt: new Date().toISOString(),
          },
          cards: {
            ...expiryResult.nextCardsState,
          },
        },
      };
    });

    navigate("/career/home");
  };

  return (
    <PageLayout
      title="Match Day Results"
      subtitle="Review all results from this day before continuing the season."
    >
      <section className="careerDayResults">
        <article className="careerDayResults__actions">
          <Button variant={BUTTON_VARIANT.PRIMARY} onClick={continueToNextDay}>
            {continueButtonLabel}
          </Button>
        </article>

        <article className="careerDayResults__panel">
          <h2>
            Day {pendingDayResults.dayOfSeason} - Week {pendingDayResults.seasonWeekNumber} (
            {pendingDayResults.dayName})
          </h2>
          {results.length === 0 ? (
            <p className="careerDayResults__empty">No match results were recorded on this day.</p>
          ) : (
            <div className="careerDayResults__resultGroups">
              {resultsByCompetition.map((competitionGroup) => (
                <section
                  className="careerDayResults__resultGroup"
                  key={`competition-result-group-${competitionGroup.competitionName}`}
                >
                  <h3 className="careerDayResults__competition">{competitionGroup.competitionName}</h3>
                  <div className="careerDayResults__resultLines">
                    {competitionGroup.results.map((result) => {
                      const isPlayerHomeTeam = isPlayerFixtureTeam({
                        fixtureTeamId: result.homeTeamId,
                        fixtureTeamName: result.homeTeamName,
                        playerTeamId,
                        playerTeamName,
                      });
                      const isPlayerAwayTeam = isPlayerFixtureTeam({
                        fixtureTeamId: result.awayTeamId,
                        fixtureTeamName: result.awayTeamName,
                        playerTeamId,
                        playerTeamName,
                      });

                      return (
                        <div className="careerDayResults__resultEntry" key={result.fixtureId}>
                          <p className="careerDayResults__resultLine">
                            <span
                              className={`careerDayResults__resultTeam careerDayResults__resultTeam--home${
                                isPlayerHomeTeam ? " careerDayResults__playerFixtureTeam" : ""
                              }`}
                            >
                              {result.homeTeamName}
                            </span>
                            <strong className="careerDayResults__resultScore">{formatScore(result)}</strong>
                            <span
                              className={`careerDayResults__resultTeam careerDayResults__resultTeam--away${
                                isPlayerAwayTeam ? " careerDayResults__playerFixtureTeam" : ""
                              }`}
                            >
                              {result.awayTeamName}
                            </span>
                          </p>
                          <p className="careerDayResults__resultMeta">
                            MR: {formatMatchRating(result.homeMatchRating)} v{" "}
                            {formatMatchRating(result.awayMatchRating)} | MRD:{" "}
                            {Math.abs(Number(result.mrd) || 0)}
                          </p>
                          {(Array.isArray(result.goalEvents) ? result.goalEvents : []).length > 0 ? (
                            <div className="careerDayResults__goalEvents">
                              {(result.goalEvents ?? [])
                                .slice()
                                .sort((leftEvent, rightEvent) => {
                                  const minuteDelta =
                                    (Number(leftEvent?.minute) || 0) - (Number(rightEvent?.minute) || 0);
                                  if (minuteDelta !== 0) {
                                    return minuteDelta;
                                  }
                                  return String(leftEvent?.id ?? "").localeCompare(
                                    String(rightEvent?.id ?? "")
                                  );
                                })
                                .map((goalEvent) => (
                                  <p className="careerDayResults__goalEventLine" key={goalEvent.id}>
                                    {formatGoalEventLine(goalEvent)}
                                  </p>
                                ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </article>

        {seasonFixtureReveal.length > 0 ? (
          <article className="careerDayResults__panel">
            <h2>Season Fixtures Generated</h2>
            <p className="careerDayResults__note">
              Fixtures are shown sorted by league and are now active for this season.
            </p>
            <div className="careerDayResults__fixtureGroups">
              {sortedSeasonFixtureReveal.map((leagueGroup) => (
                <section className="careerDayResults__fixtureGroup" key={leagueGroup.competitionId}>
                  <button
                    type="button"
                    className="careerDayResults__accordionButton"
                    onClick={() =>
                      setExpandedLeagueId((currentLeagueId) =>
                        currentLeagueId === leagueGroup.competitionId ? "" : leagueGroup.competitionId
                      )
                    }
                  >
                    <span>{leagueGroup.competitionName}</span>
                    <span>{effectiveExpandedLeagueId === leagueGroup.competitionId ? "-" : "+"}</span>
                  </button>
                  {effectiveExpandedLeagueId === leagueGroup.competitionId ? (
                    <div className="careerDayResults__matchDayGroups">
                      {buildMatchDayGroups(leagueGroup.fixtures).map((matchDayGroup) => (
                        <section
                          className="careerDayResults__matchDayGroup"
                          key={`${leagueGroup.competitionId}-md-${matchDayGroup.matchDay}`}
                        >
                          <h4>Match Day {matchDayGroup.matchDay}</h4>
                          <div className="careerDayResults__matchDayLines">
                            {matchDayGroup.fixtures.map((fixture) => {
                              const isPlayerHomeTeam = isPlayerFixtureTeam({
                                fixtureTeamId: fixture.homeTeamId,
                                fixtureTeamName: fixture.homeTeamName,
                                playerTeamId,
                                playerTeamName,
                              });
                              const isPlayerAwayTeam = isPlayerFixtureTeam({
                                fixtureTeamId: fixture.awayTeamId,
                                fixtureTeamName: fixture.awayTeamName,
                                playerTeamId,
                                playerTeamName,
                              });

                              return (
                                <p key={fixture.fixtureId}>
                                  <span
                                    className={isPlayerHomeTeam ? "careerDayResults__playerFixtureTeam" : undefined}
                                  >
                                    {fixture.homeTeamName}
                                  </span>{" "}
                                  v{" "}
                                  <span
                                    className={isPlayerAwayTeam ? "careerDayResults__playerFixtureTeam" : undefined}
                                  >
                                    {fixture.awayTeamName}
                                  </span>
                                </p>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </article>
        ) : null}

        <article className="careerDayResults__actions">
          <Button variant={BUTTON_VARIANT.PRIMARY} onClick={continueToNextDay}>
            {continueButtonLabel}
          </Button>
        </article>
      </section>
    </PageLayout>
  );
};

export default CareerDayResults;
