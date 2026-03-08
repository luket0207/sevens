import { CALENDAR_EVENT_TYPES } from "../constants/calendarConstants";
import {
  addEventToSeasonDay,
  createSeasonScaffold,
  getMonthIndexFromDayIndex,
  sortSeasonEvents,
} from "./calendarModel";
import {
  buildChampionsCupEvents,
  buildLeagueCupEvents,
  buildPlayoffPlaceholderEvents,
} from "./cupScheduleGeneration";
import { buildLeagueFiveFixtures } from "./fixtureGeneration";

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

const buildCalendarDebug = ({ season, leagueFixtures, leagueCupEvents, championsCupEvents, playoffEvents }) => {
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
      leagueCupEvents: leagueCupEvents.length,
      championsCupEvents: championsCupEvents.length,
      playoffEvents: playoffEvents.length,
      leagueMatchesInCalendar: leagueMatchCount,
    },
    leagueFixturePreview: buildInsertedEventSummary(leagueFixtures),
    cupEventPreview: buildInsertedEventSummary([...leagueCupEvents, ...championsCupEvents]),
    playoffPreview: buildInsertedEventSummary(playoffEvents),
  };
};

export const buildCareerCalendarState = ({ careerWorld }) => {
  const { season, dayLookup } = createSeasonScaffold({
    seasonId: "season-1",
    seasonNumber: 1,
  });

  const leagueFixtures = buildLeagueFiveFixtures({ careerWorld });
  const leagueCupEvents = buildLeagueCupEvents();
  const championsCupResult = buildChampionsCupEvents({ careerWorld });
  const championsCupEvents = championsCupResult.events;
  const playoffEvents = buildPlayoffPlaceholderEvents();
  const allEvents = [...leagueFixtures, ...leagueCupEvents, ...championsCupEvents, ...playoffEvents];

  insertEventsIntoSeason({
    dayLookup,
    events: allEvents,
  });
  sortSeasonEvents(season);

  const initialCurrentDayIndex = 0;

  return {
    seasons: [season],
    activeSeasonId: season.id,
    currentDayIndex: initialCurrentDayIndex,
    visibleMonthIndex: getMonthIndexFromDayIndex(initialCurrentDayIndex),
    pendingFlashDayIndex: null,
    championsCupStructure: championsCupResult.structure,
    debug: buildCalendarDebug({
      season,
      leagueFixtures,
      leagueCupEvents,
      championsCupEvents,
      playoffEvents,
    }),
  };
};
