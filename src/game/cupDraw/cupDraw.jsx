import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
import { getMonthIndexFromDayIndex } from "../careerCalendar/utils/calendarModel";
import "./cupDraw.scss";

const EMPTY_DRAWS = Object.freeze([]);

const CupDraw = () => {
  const navigate = useNavigate();
  const { gameState, setGameState } = useGame();

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const calendar = gameState?.career?.calendar ?? null;
  const pendingCupDraw = calendar?.pendingCupDraw ?? null;
  const draws = Array.isArray(pendingCupDraw?.draws) ? pendingCupDraw.draws : EMPTY_DRAWS;
  const seasons = Array.isArray(calendar?.seasons) ? calendar.seasons : [];
  const activeSeason = seasons.find((season) => season.id === calendar?.activeSeasonId) ?? seasons[0] ?? null;
  const rawCurrentDayIndex = Number.isInteger(calendar?.currentDayIndex) ? calendar.currentDayIndex : 0;
  const [revealedByDrawId, setRevealedByDrawId] = useState({});

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

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || !calendar || !activeSeason) {
    return <Navigate to="/career/start" replace />;
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

  const continueFlow = () => {
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
        </article>

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
              {visibleFixtures.length === 0 ? (
                <p className="cupDrawPage__meta">No fixtures revealed yet.</p>
              ) : (
                <ul className="cupDrawPage__fixtureList">
                  {visibleFixtures.map((fixture) => (
                    <li key={fixture.fixtureId}>
                      {fixture.homeTeamName} vs {fixture.awayTeamName}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}

        <article className="cupDrawPage__continue">
          <Button variant={BUTTON_VARIANT.PRIMARY} onClick={continueFlow}>
            Continue
          </Button>
        </article>
      </section>
    </PageLayout>
  );
};

export default CupDraw;
