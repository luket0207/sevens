import { CALENDAR_EVENT_TYPES } from "../constants/calendarConstants";
import { CHAMPIONS_CUP_DRAW_SLOTS, CHAMPIONS_CUP_MATCH_SLOTS } from "../constants/cupScheduleSchema";
import {
  addEventToSeasonDay,
  createSeasonScaffold,
  getMonthIndexFromDayIndex,
  sortSeasonEvents,
} from "./calendarModel";
import { buildLeagueCupEvents, buildPlayoffPlaceholderEvents } from "./cupScheduleGeneration";
import { buildInitialCareerSimulationState } from "../../careerSimulation";

const buildEventTypeCounts = (season) => {
  return season.days.reduce((counts, day) => {
    day.events.forEach((event) => {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
    });
    return counts;
  }, {});
};

const buildInsertedEventSummary = (events) => {
  return events.map((event) => ({
    id: event.id,
    type: event.type,
    competitionName: event.competitionName,
    weekNumber: event.weekNumber,
    dayOfWeek: event.dayOfWeek,
    label: event.label,
    opponent: event.opponent ?? null,
  }));
};

const insertEventsIntoSeason = ({ dayLookup, events }) => {
  events.forEach((event) => {
    addEventToSeasonDay({
      dayLookup,
      weekNumber: event.weekNumber,
      dayOfWeek: event.dayOfWeek,
      event,
    });
  });
};

const buildChampionsCupCalendarEvents = () => {
  const drawEvents = CHAMPIONS_CUP_DRAW_SLOTS.map((slot) => ({
    id: slot.id,
    type: CALENDAR_EVENT_TYPES.CUP_DRAW,
    competitionId: "champions-cup",
    competitionName: "Champions Cup",
    stageLabel: slot.stageLabel,
    label: slot.stageLabel,
    weekNumber: slot.weekNumber,
    dayOfWeek: slot.dayOfWeek,
  }));

  const matchEvents = CHAMPIONS_CUP_MATCH_SLOTS.map((slot) => ({
    id: slot.id,
    type: slot.eventType,
    competitionId: "champions-cup",
    competitionName: "Champions Cup",
    stageLabel: slot.stageLabel,
    opponent: "Various",
    isHome: true,
    label: slot.stageLabel,
    weekNumber: slot.weekNumber,
    dayOfWeek: slot.dayOfWeek,
  }));

  return [...drawEvents, ...matchEvents];
};

const buildCalendarDebug = ({
  season,
  leagueFixtures,
  leagueCupEvents,
  championsCupEvents,
  playoffEvents,
  simulationState,
}) => {
  const leagueMatchCount = season.days.reduce((total, day) => {
    const dayLeagueMatches = day.events.filter(
      (event) => event.type === CALENDAR_EVENT_TYPES.LEAGUE_MATCH
    ).length;
    return total + dayLeagueMatches;
  }, 0);

  return {
    seasonShape: {
      totalMonths: season.totalMonths,
      totalWeeks: season.totalWeeks,
      totalDays: season.totalDays,
    },
    eventTypeCounts: buildEventTypeCounts(season),
    totals: {
      totalScheduledEvents: season.days.reduce((total, day) => total + day.events.length, 0),
      leagueFixtures: leagueFixtures.length,
      simulatedLeagueFixtures: simulationState?.league?.fixtureCount ?? 0,
      leagueCupEvents: leagueCupEvents.length,
      championsCupEvents: championsCupEvents.length,
      playoffEvents: playoffEvents.length,
      leagueMatchesInCalendar: leagueMatchCount,
    },
    leagueFixturePreview: buildInsertedEventSummary(leagueFixtures),
    cupEventPreview: buildInsertedEventSummary([...leagueCupEvents, ...championsCupEvents]),
    playoffPreview: buildInsertedEventSummary(playoffEvents),
    simulation: simulationState?.debug ?? {},
  };
};

export const buildCareerCalendarState = ({
  careerWorld,
  carryOverTeamFormByTeamId = {},
  startingCareerDayNumber = 0,
}) => {
  const { season, dayLookup } = createSeasonScaffold({
    seasonId: "season-1",
    seasonNumber: 1,
  });

  const simulationState = buildInitialCareerSimulationState({
    careerWorld,
    carryOverTeamFormByTeamId,
  });
  const leagueFixtures = simulationState?.league?.playerCalendarEvents ?? [];
  const leagueCupEvents = buildLeagueCupEvents();
  const championsCupEvents = buildChampionsCupCalendarEvents();
  const playoffEvents = buildPlayoffPlaceholderEvents();
  const allEvents = [...leagueFixtures, ...leagueCupEvents, ...championsCupEvents, ...playoffEvents];

  insertEventsIntoSeason({
    dayLookup,
    events: allEvents,
  });
  sortSeasonEvents(season);

  const initialCurrentDayIndex = 0;
  const safeStartingCareerDayNumber = Math.max(0, Number.parseInt(startingCareerDayNumber, 10) || 0);

  return {
    seasons: [season],
    activeSeasonId: season.id,
    currentDayIndex: initialCurrentDayIndex,
    careerDayNumber: safeStartingCareerDayNumber,
    visibleMonthIndex: getMonthIndexFromDayIndex(initialCurrentDayIndex),
    pendingFlashDayIndex: null,
    pendingDayResults: null,
    pendingCupDraw: null,
    seasonFixturesRevealed: false,
    championsCupStructure: simulationState?.cups?.competitions?.championsCup ?? {},
    simulation: simulationState,
    debug: buildCalendarDebug({
      season,
      leagueFixtures,
      leagueCupEvents,
      championsCupEvents,
      playoffEvents,
      simulationState,
    }),
  };
};
