import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
import { getMonthIndexFromDayIndex } from "../careerCalendar/utils/calendarModel";
import { ensureCareerCardState } from "../cards";
import { getContinueFlowLabel, resolveCupDrawContinueAction } from "../careerFlow/utils/continueFlow";
import { resolveDayOneSetupGateState } from "../careerFlow/utils/dayOneSetupGate";
import "./cupDraw.scss";

const EMPTY_DRAWS = Object.freeze([]);
const LEAGUE_FIXTURE_DRAW_STAGE_KEY = "season-fixtures";

const CupDraw = () => {
  const navigate = useNavigate();
  const { gameState, setGameState } = useGame();

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const calendar = gameState?.career?.calendar ?? null;
  const pendingCupDraw = calendar?.pendingCupDraw ?? null;
  const cardsState = ensureCareerCardState(gameState?.career?.cards);
  const draws = Array.isArray(pendingCupDraw?.draws) ? pendingCupDraw.draws : EMPTY_DRAWS;
  const seasons = Array.isArray(calendar?.seasons) ? calendar.seasons : [];
  const activeSeason = seasons.find((season) => season.id === calendar?.activeSeasonId) ?? seasons[0] ?? null;
  const rawCurrentDayIndex = Number.isInteger(calendar?.currentDayIndex) ? calendar.currentDayIndex : 0;
  const currentDay = activeSeason?.days?.[rawCurrentDayIndex] ?? null;
  const dayOneSetupGateState = resolveDayOneSetupGateState({
    currentDay,
    playerTeam: gameState?.career?.world?.playerTeam ?? null,
  });
  const [revealedByDrawId, setRevealedByDrawId] = useState({});
  const isFirstDaySetupDraw = Number(pendingCupDraw?.dayOfSeason) === 1;
  const drawIdsByType = useMemo(() => {
    return draws.reduce(
      (state, draw) => {
        if (draw?.stageKey === LEAGUE_FIXTURE_DRAW_STAGE_KEY) {
          state.leagueDrawIds.push(draw.id);
        } else {
          state.cupDrawIds.push(draw.id);
        }
        return state;
      },
      {
        cupDrawIds: [],
        leagueDrawIds: [],
      }
    );
  }, [draws]);

  const revealProgressByDraw = useMemo(
    () =>
      draws.reduce((state, draw) => {
        const total = Array.isArray(draw.fixtures) ? draw.fixtures.length : 0;
        state[draw.id] = {
          total,
          revealed: Math.min(revealedByDrawId[draw.id] ?? 0, total),
        };
        return state;
      }, {}),
    [draws, revealedByDrawId]
  );
  const isDrawFullyRevealed = (drawId) => {
    const progress = revealProgressByDraw[drawId];
    if (!progress) {
      return true;
    }
    return progress.revealed >= progress.total;
  };
  const allDrawsRevealed = draws.every((draw) => isDrawFullyRevealed(draw.id));
  const canContinue = allDrawsRevealed;
  const hasCupDraws = drawIdsByType.cupDrawIds.length > 0;
  const hasLeagueDraws = drawIdsByType.leagueDrawIds.length > 0;
  const cupDrawsRevealed = drawIdsByType.cupDrawIds.every((drawId) => isDrawFullyRevealed(drawId));
  const leagueDrawsRevealed = drawIdsByType.leagueDrawIds.every((drawId) => isDrawFullyRevealed(drawId));
  const continueAction = resolveCupDrawContinueAction({
    hasPendingDayResults: Boolean(calendar?.pendingDayResults),
    isDayOneSetupGateActive: dayOneSetupGateState.isGateActive,
  });
  const continueButtonLabel = getContinueFlowLabel(continueAction);

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || !calendar || !activeSeason) {
    return <Navigate to="/career/start" replace />;
  }

  if (cardsState?.pendingRewardChoice) {
    return <Navigate to="/career/card-reward" replace />;
  }

  if (!pendingCupDraw) {
    return <Navigate to="/career/home" replace />;
  }

  const revealNextFixture = (drawId) => {
    setRevealedByDrawId((prev) => ({
      ...prev,
      [drawId]: (prev[drawId] ?? 0) + 1,
    }));
  };

  const revealAllFixtures = (drawId, total) => {
    setRevealedByDrawId((prev) => ({
      ...prev,
      [drawId]: total,
    }));
  };
  const revealAllForDrawIds = (drawIds) => {
    setRevealedByDrawId((prev) =>
      drawIds.reduce((state, drawId) => {
        const progress = revealProgressByDraw[drawId];
        state[drawId] = progress?.total ?? 0;
        return state;
      }, { ...prev })
    );
  };

  const continueFlow = () => {
    if (dayOneSetupGateState.isGateActive) {
      setGameState((prev) => ({
        ...prev,
        career: {
          ...prev.career,
          calendar: {
            ...(prev.career?.calendar ?? {}),
            pendingCupDraw: null,
          },
        },
      }));
      navigate("/team-management");
      return;
    }

    if (calendar?.pendingDayResults) {
      setGameState((prev) => ({
        ...prev,
        career: {
          ...prev.career,
          calendar: {
            ...(prev.career?.calendar ?? {}),
            pendingCupDraw: null,
          },
        },
      }));
      navigate("/career/day-results");
      return;
    }

    const isSeasonComplete = rawCurrentDayIndex >= activeSeason.totalDays - 1;
    const nextDayIndex = isSeasonComplete ? rawCurrentDayIndex : rawCurrentDayIndex + 1;
    const nextVisibleMonthIndex = getMonthIndexFromDayIndex(nextDayIndex);

    setGameState((prev) => ({
      ...prev,
      career: {
        ...prev.career,
        calendar: {
          ...(prev.career?.calendar ?? {}),
          currentDayIndex: nextDayIndex,
          visibleMonthIndex: nextVisibleMonthIndex,
          pendingCupDraw: null,
          pendingFlashDayIndex: null,
          lastAdvancedAt: new Date().toISOString(),
        },
      },
    }));

    navigate("/career/home");
  };

  return (
    <PageLayout
      title="Cup Draw"
      subtitle="Resolve cup draw days and reveal new fixtures game-by-game or all at once."
    >
      <section className="cupDrawPage">
        <article className="cupDrawPage__summary">
          <p>
            Day {pendingCupDraw.dayOfSeason} - Week {pendingCupDraw.seasonWeekNumber} ({pendingCupDraw.dayName})
          </p>
          {isFirstDaySetupDraw && !canContinue ? (
            <p className="cupDrawPage__continueHint">
              Reveal all draw results before continuing.
            </p>
          ) : null}
        </article>

        <article className="cupDrawPage__topContinue">
          <Button variant={BUTTON_VARIANT.PRIMARY} onClick={continueFlow} disabled={!canContinue}>
            {continueButtonLabel}
          </Button>
        </article>

        {isFirstDaySetupDraw ? (
          <article className="cupDrawPage__drawControlPanel">
            <h2>Day 1 Draw Controls</h2>
            <div className="cupDrawPage__drawControlActions">
              <Button
                variant={BUTTON_VARIANT.SECONDARY}
                onClick={() => revealAllForDrawIds(drawIdsByType.cupDrawIds)}
                disabled={!hasCupDraws || cupDrawsRevealed}
              >
                Generate Cup
              </Button>
              <Button
                variant={BUTTON_VARIANT.SECONDARY}
                onClick={() => revealAllForDrawIds(drawIdsByType.leagueDrawIds)}
                disabled={!hasLeagueDraws || leagueDrawsRevealed}
              >
                Generate Leagues
              </Button>
              <Button
                variant={BUTTON_VARIANT.PRIMARY}
                onClick={() => revealAllForDrawIds(draws.map((draw) => draw.id))}
                disabled={canContinue}
              >
                Generate All
              </Button>
            </div>
          </article>
        ) : null}

        {draws.map((draw) => {
          const fixtures = Array.isArray(draw.fixtures) ? draw.fixtures : [];
          const progress = revealProgressByDraw[draw.id] ?? { revealed: 0, total: fixtures.length };
          const visibleFixtures = fixtures.slice(0, progress.revealed);

          return (
            <article className="cupDrawPage__drawCard" key={draw.id}>
              <h2>
                {draw.competitionName} - {draw.stageLabel}
              </h2>
              <p className="cupDrawPage__meta">
                Revealed {progress.revealed}/{progress.total}
              </p>
              {!isFirstDaySetupDraw ? (
                <div className="cupDrawPage__actions">
                  <Button
                    variant={BUTTON_VARIANT.SECONDARY}
                    onClick={() => revealNextFixture(draw.id)}
                    disabled={progress.revealed >= progress.total}
                  >
                    Reveal Next Fixture
                  </Button>
                  <Button
                    variant={BUTTON_VARIANT.PRIMARY}
                    onClick={() => revealAllFixtures(draw.id, progress.total)}
                    disabled={progress.revealed >= progress.total}
                  >
                    Reveal All
                  </Button>
                </div>
              ) : null}
              {visibleFixtures.length === 0 ? (
                <p className="cupDrawPage__meta">No fixtures revealed yet.</p>
              ) : (
                <div className="cupDrawPage__fixtureRows">
                  {visibleFixtures.map((fixture) => (
                    <p className="cupDrawPage__fixtureRow" key={fixture.fixtureId}>
                      {fixture.displayLabel ?? `${fixture.homeTeamName} v ${fixture.awayTeamName}`}
                    </p>
                  ))}
                </div>
              )}
            </article>
          );
        })}

        <article className="cupDrawPage__continue">
          <Button variant={BUTTON_VARIANT.PRIMARY} onClick={continueFlow} disabled={!canContinue}>
            {continueButtonLabel}
          </Button>
        </article>
      </section>
    </PageLayout>
  );
};

export default CupDraw;
