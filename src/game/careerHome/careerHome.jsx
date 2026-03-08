import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import FlashModal from "../../engine/ui/flashModal/flashModal";
import PageLayout from "../shared/pageLayout/pageLayout";
import {
  buildCareerCalendarState,
  buildDayTransitionLabel,
  CareerCalendarDebugPanel,
  CareerControlPanel,
  LeagueTablePanel,
  SeasonCalendar,
} from "../careerCalendar";
import { clampMonthIndex, getMonthIndexFromDayIndex } from "../careerCalendar/utils/calendarModel";
import {
  buildCompletedDayResults,
  buildSeasonFixturesByLeague,
  getSimulationFixtureById,
  simulateCareerDay,
} from "../careerSimulation";
import "./careerHome.scss";

const CALENDAR_STATUS_READY = "ready";
const DAY_FLASH_DURATION_SECONDS = 1.2;

const getActiveSeason = (seasons, activeSeasonId) => {
  if (!Array.isArray(seasons) || seasons.length === 0) {
    return null;
  }

  return seasons.find((season) => season.id === activeSeasonId) ?? seasons[0];
};

const CareerHome = () => {
  const navigate = useNavigate();
  const { gameState, setGameState, setGameValue } = useGame();
  const [isFlashOpen, setIsFlashOpen] = useState(false);
  const [flashContent, setFlashContent] = useState("");
  const [isSimulatingDay, setIsSimulatingDay] = useState(false);

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const careerWorld = useMemo(() => gameState?.career?.world ?? null, [gameState?.career?.world]);
  const competitions = useMemo(
    () => (Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : []),
    [careerWorld]
  );
  const calendarState = useMemo(() => gameState?.career?.calendar ?? null, [gameState?.career?.calendar]);
  const simulationState = useMemo(() => calendarState?.simulation ?? null, [calendarState?.simulation]);
  const seasons = useMemo(
    () => (Array.isArray(calendarState?.seasons) ? calendarState.seasons : []),
    [calendarState]
  );
  const activeSeason = useMemo(
    () => getActiveSeason(seasons, calendarState?.activeSeasonId),
    [calendarState?.activeSeasonId, seasons]
  );

  useEffect(() => {
    if (generationStatus !== "complete" || competitions.length === 0) {
      return;
    }

    const currentCalendarState = calendarState ?? {};
    const hasCalendarForCurrentWorld =
      currentCalendarState.status === CALENDAR_STATUS_READY &&
      currentCalendarState.sourceGeneratedAt === (careerWorld?.generatedAt ?? "") &&
      currentCalendarState?.simulation &&
      Array.isArray(currentCalendarState.seasons) &&
      currentCalendarState.seasons.length > 0;

    if (hasCalendarForCurrentWorld) {
      return;
    }

    const nextCalendarState = buildCareerCalendarState({ careerWorld });

    setGameState((prev) => ({
      ...prev,
      career: {
        ...prev.career,
        calendar: {
          ...(prev.career?.calendar ?? {}),
          status: CALENDAR_STATUS_READY,
          sourceGeneratedAt: careerWorld?.generatedAt ?? "",
          seasons: nextCalendarState.seasons,
          activeSeasonId: nextCalendarState.activeSeasonId,
          currentDayIndex: nextCalendarState.currentDayIndex,
          visibleMonthIndex: nextCalendarState.visibleMonthIndex,
          pendingFlashDayIndex: null,
          pendingDayResults: nextCalendarState.pendingDayResults ?? null,
          pendingCupDraw: nextCalendarState.pendingCupDraw ?? null,
          seasonFixturesRevealed: Boolean(nextCalendarState.seasonFixturesRevealed),
          lastAdvancedAt: "",
          championsCupStructure: nextCalendarState.championsCupStructure,
          simulation: nextCalendarState.simulation,
          debug: nextCalendarState.debug,
        },
      },
    }));
  }, [calendarState, careerWorld, competitions.length, generationStatus, setGameState]);

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || competitions.length === 0) {
    return <Navigate to="/career/start" replace />;
  }

  if (!activeSeason) {
    return (
      <PageLayout
        title="Career Home"
        subtitle="Preparing your season calendar and game loop structure from generated career data."
      >
        <section className="careerHome__panel">
          <p className="careerHome__hint">Initialising calendar model...</p>
        </section>
      </PageLayout>
    );
  }

  if (calendarState?.pendingCupDraw) {
    return <Navigate to="/cup-draw" replace />;
  }

  if (calendarState?.pendingDayResults) {
    return <Navigate to="/career/day-results" replace />;
  }

  const rawCurrentDayIndex = Number.isInteger(calendarState?.currentDayIndex)
    ? calendarState.currentDayIndex
    : 0;
  const currentDayIndex = Math.max(0, Math.min(rawCurrentDayIndex, activeSeason.totalDays - 1));

  const derivedVisibleMonthIndex = Number.isInteger(calendarState?.visibleMonthIndex)
    ? calendarState.visibleMonthIndex
    : getMonthIndexFromDayIndex(currentDayIndex);
  const visibleMonthIndex = clampMonthIndex(derivedVisibleMonthIndex, activeSeason.months.length);
  const currentDay = activeSeason.days[currentDayIndex] ?? null;
  const visibleMonth = activeSeason.months[visibleMonthIndex] ?? null;
  const isSeasonComplete = currentDayIndex >= activeSeason.totalDays - 1;
  const currentDayLeagueFixtureIds = simulationState?.league?.fixtureIdsByDay?.[String(currentDayIndex)] ?? [];
  const currentDayCupFixtureIds = simulationState?.cups?.fixtureIdsByDay?.[String(currentDayIndex)] ?? [];
  const currentDayPlayerFixture = [...currentDayLeagueFixtureIds, ...currentDayCupFixtureIds]
    .map((fixtureId) =>
      getSimulationFixtureById({
        simulationState,
        fixtureId,
      })
    )
    .find((fixture) => {
      if (!fixture || fixture.status === "completed") {
        return false;
      }
      return fixture.homeTeamId === careerWorld?.playerTeam?.id || fixture.awayTeamId === careerWorld?.playerTeam?.id;
    });
  const pendingPlayerFixtureId = simulationState?.pendingPlayerFixtureId ?? "";

  const updateVisibleMonth = (nextMonthIndex) => {
    setGameValue(
      "career.calendar.visibleMonthIndex",
      clampMonthIndex(nextMonthIndex, activeSeason.months.length)
    );
  };

  const moveToNextDay = () => {
    if (!currentDay || isSimulatingDay) {
      return;
    }

    if (isSeasonComplete) {
      navigate("/career/season-summary");
      return;
    }

    const performSimulation = async () => {
      setIsSimulatingDay(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const simulationResult = simulateCareerDay({
        simulationState,
        careerWorld,
        currentDay,
      });

      if (simulationResult.pendingPlayerFixtureId) {
        setGameState((prev) => ({
          ...prev,
          career: {
            ...prev.career,
            calendar: {
              ...(prev.career?.calendar ?? {}),
              simulation: simulationResult.nextSimulationState,
              championsCupStructure:
                simulationResult.nextSimulationState?.cups?.competitions?.championsCup ?? {},
              debug: {
                ...(prev.career?.calendar?.debug ?? {}),
                simulation: simulationResult.nextSimulationState?.debug ?? {},
              },
              pendingCupDraw: null,
              pendingDayResults: null,
            },
          },
        }));
        setIsSimulatingDay(false);
        navigate("/match");
        return;
      }

      const dayResults = buildCompletedDayResults({
        simulationState: simulationResult.nextSimulationState,
        currentDay,
      });
      const shouldRevealSeasonFixtures =
        currentDay.dayOfSeason === 1 && !calendarState?.seasonFixturesRevealed;
      const seasonFixturesByLeague = shouldRevealSeasonFixtures
        ? buildSeasonFixturesByLeague({
            simulationState: simulationResult.nextSimulationState,
          })
        : [];

      if (simulationResult.createdCupDraws.length > 0) {
        setGameState((prev) => ({
          ...prev,
          career: {
            ...prev.career,
            calendar: {
              ...(prev.career?.calendar ?? {}),
              simulation: simulationResult.nextSimulationState,
              championsCupStructure:
                simulationResult.nextSimulationState?.cups?.competitions?.championsCup ?? {},
              debug: {
                ...(prev.career?.calendar?.debug ?? {}),
                simulation: simulationResult.nextSimulationState?.debug ?? {},
              },
              pendingCupDraw: {
                dayOfSeason: currentDay.dayOfSeason,
                seasonWeekNumber: currentDay.seasonWeekNumber,
                dayName: currentDay.dayName,
                draws: simulationResult.createdCupDraws,
              },
              pendingDayResults:
                dayResults.length > 0 || shouldRevealSeasonFixtures
                  ? {
                      dayOfSeason: currentDay.dayOfSeason,
                      seasonWeekNumber: currentDay.seasonWeekNumber,
                      dayName: currentDay.dayName,
                      results: dayResults,
                      seasonFixtureReveal: shouldRevealSeasonFixtures ? seasonFixturesByLeague : [],
                    }
                  : null,
            },
          },
        }));
        setIsSimulatingDay(false);
        navigate("/cup-draw");
        return;
      }

      if (dayResults.length > 0 || shouldRevealSeasonFixtures) {
        setGameState((prev) => ({
          ...prev,
          career: {
            ...prev.career,
            calendar: {
              ...(prev.career?.calendar ?? {}),
              simulation: simulationResult.nextSimulationState,
              championsCupStructure:
                simulationResult.nextSimulationState?.cups?.competitions?.championsCup ?? {},
              debug: {
                ...(prev.career?.calendar?.debug ?? {}),
                simulation: simulationResult.nextSimulationState?.debug ?? {},
              },
              pendingCupDraw: null,
              pendingDayResults: {
                dayOfSeason: currentDay.dayOfSeason,
                seasonWeekNumber: currentDay.seasonWeekNumber,
                dayName: currentDay.dayName,
                results: dayResults,
                seasonFixtureReveal: shouldRevealSeasonFixtures ? seasonFixturesByLeague : [],
              },
            },
          },
        }));
        setIsSimulatingDay(false);
        navigate("/career/day-results");
        return;
      }

      const nextDayIndex = currentDayIndex + 1;
      const nextMonthIndex = getMonthIndexFromDayIndex(nextDayIndex);
      const nextDay = activeSeason.days[nextDayIndex] ?? null;

      if (nextDay) {
        setFlashContent(buildDayTransitionLabel(nextDay));
        setIsFlashOpen(true);
      }

      setGameState((prev) => ({
        ...prev,
        career: {
          ...prev.career,
          calendar: {
            ...(prev.career?.calendar ?? {}),
            currentDayIndex: nextDayIndex,
            visibleMonthIndex: nextMonthIndex,
            pendingFlashDayIndex: null,
            lastAdvancedAt: new Date().toISOString(),
            simulation: simulationResult.nextSimulationState,
            championsCupStructure: simulationResult.nextSimulationState?.cups?.competitions?.championsCup ?? {},
            debug: {
              ...(prev.career?.calendar?.debug ?? {}),
              simulation: simulationResult.nextSimulationState?.debug ?? {},
            },
            pendingCupDraw: null,
            pendingDayResults: null,
          },
        },
      }));
      setIsSimulatingDay(false);
    };

    performSimulation();
  };

  const generationTotals = careerWorld?.totals ?? {};

  return (
    <PageLayout
      title="Career Home"
      subtitle="Advance day-by-day through the season while league and cup fixtures simulate around your team."
    >
      <section className="careerHome">
        <section className="careerHome__topRow">
          <article className="careerHome__panel careerHome__panel--calendar">
            <SeasonCalendar
              season={activeSeason}
              visibleMonthIndex={visibleMonthIndex}
              currentDayIndex={currentDayIndex}
              onPreviousMonth={() => updateVisibleMonth(visibleMonthIndex - 1)}
              onNextMonth={() => updateVisibleMonth(visibleMonthIndex + 1)}
              canGoPreviousMonth={visibleMonthIndex > 0}
              canGoNextMonth={visibleMonthIndex < activeSeason.months.length - 1}
            />
          </article>

          <aside className="careerHome__panel careerHome__panel--controls">
            <CareerControlPanel
              currentDayLabel={buildDayTransitionLabel(currentDay)}
              isSeasonComplete={isSeasonComplete}
              hasPlayerMatchToday={Boolean(currentDayPlayerFixture) || Boolean(pendingPlayerFixtureId)}
              isSimulatingDay={isSimulatingDay}
              onAdvanceDay={moveToNextDay}
            />
          </aside>
        </section>

        {isSimulatingDay ? (
          <section className="careerHome__panel careerHome__panel--simulating">
            <p className="careerHome__hint">Simulating fixtures and updating standings...</p>
          </section>
        ) : null}

        <section className="careerHome__panel careerHome__panel--leagueTable">
          <LeagueTablePanel
            tablesByCompetition={simulationState?.league?.tablesByCompetition ?? {}}
            defaultCompetitionId={careerWorld?.playerTeam?.competitionId ?? "league-5"}
            playerTeamId={careerWorld?.playerTeam?.id ?? ""}
          />
        </section>

        <section className="careerHome__panel careerHome__panel--debug">
          <CareerCalendarDebugPanel
            generationSummary={generationTotals}
            calendarDebug={calendarState?.debug}
            championsCupStructure={calendarState?.championsCupStructure}
            managerDebug={careerWorld?.debug?.managerGeneration}
            simulationDebug={calendarState?.simulation?.debug}
            currentDay={currentDay}
            visibleMonthLabel={visibleMonth?.label}
          />
        </section>
      </section>

      <FlashModal
        isOpen={isFlashOpen}
        content={
          <div>
            <p>New Day Started</p>
            <p>{flashContent}</p>
          </div>
        }
        durationSeconds={DAY_FLASH_DURATION_SECONDS}
        onComplete={() => setIsFlashOpen(false)}
      />
    </PageLayout>
  );
};

export default CareerHome;
