import {
  CALENDAR_EVENT_TYPES,
  DAY_LABELS,
  DAY_SHORT_LABELS,
  DAYS_PER_WEEK,
  MONTH_LABELS,
  SEASON_DAY_COUNT,
  SEASON_MONTH_COUNT,
  SEASON_WEEK_COUNT,
  WEEKS_PER_MONTH,
} from "../constants/calendarConstants";

const buildLookupKey = (weekNumber, dayOfWeek) => `${weekNumber}-${dayOfWeek}`;

const EVENT_PRIORITY = Object.freeze({
  [CALENDAR_EVENT_TYPES.LEAGUE_MATCH]: 1,
  [CALENDAR_EVENT_TYPES.CUP_MATCH]: 2,
  [CALENDAR_EVENT_TYPES.PLAYOFF_MATCH]: 3,
  [CALENDAR_EVENT_TYPES.FINAL]: 4,
  [CALENDAR_EVENT_TYPES.CUP_DRAW]: 5,
});

export const clampMonthIndex = (monthIndex, monthCount = SEASON_MONTH_COUNT) => {
  if (monthCount <= 0) return 0;
  return Math.max(0, Math.min(monthIndex, monthCount - 1));
};

export const getMonthIndexFromDayIndex = (dayIndex) => {
  const safeDayIndex = Math.max(0, Math.min(dayIndex, SEASON_DAY_COUNT - 1));
  const weekNumber = Math.floor(safeDayIndex / DAYS_PER_WEEK) + 1;
  return Math.floor((weekNumber - 1) / WEEKS_PER_MONTH);
};

export const buildDayTransitionLabel = (day) => {
  if (!day) return "New Day";
  return `${day.monthLabel} • Week ${day.seasonWeekNumber} • ${day.dayName}`;
};

export const createSeasonScaffold = ({ seasonId = "season-1", seasonNumber = 1 }) => {
  const dayLookup = new Map();
  const days = [];
  const weeks = [];
  const months = MONTH_LABELS.map((label, index) => ({
    id: `${seasonId}-month-${String(index + 1).padStart(2, "0")}`,
    monthNumber: index + 1,
    monthIndex: index,
    label,
    weeks: [],
  }));

  for (let seasonWeekNumber = 1; seasonWeekNumber <= SEASON_WEEK_COUNT; seasonWeekNumber += 1) {
    const monthIndex = Math.floor((seasonWeekNumber - 1) / WEEKS_PER_MONTH);
    const weekInMonth = ((seasonWeekNumber - 1) % WEEKS_PER_MONTH) + 1;
    const weekId = `${seasonId}-week-${String(seasonWeekNumber).padStart(2, "0")}`;
    const weekDays = [];

    for (let dayOfWeek = 0; dayOfWeek < DAYS_PER_WEEK; dayOfWeek += 1) {
      const absoluteDayIndex = (seasonWeekNumber - 1) * DAYS_PER_WEEK + dayOfWeek;
      const day = {
        id: `${weekId}-day-${dayOfWeek + 1}`,
        absoluteDayIndex,
        dayOfSeason: absoluteDayIndex + 1,
        seasonWeekNumber,
        weekInMonth,
        monthIndex,
        monthLabel: MONTH_LABELS[monthIndex],
        dayOfWeek,
        dayName: DAY_LABELS[dayOfWeek],
        dayShortName: DAY_SHORT_LABELS[dayOfWeek],
        events: [],
      };

      weekDays.push(day);
      days.push(day);
      dayLookup.set(buildLookupKey(seasonWeekNumber, dayOfWeek), day);
    }

    const week = {
      id: weekId,
      seasonWeekNumber,
      weekInMonth,
      monthIndex,
      days: weekDays,
    };

    weeks.push(week);
    months[monthIndex].weeks.push(week);
  }

  return {
    season: {
      id: seasonId,
      seasonNumber,
      months,
      weeks,
      days,
      totalMonths: SEASON_MONTH_COUNT,
      totalWeeks: SEASON_WEEK_COUNT,
      totalDays: SEASON_DAY_COUNT,
    },
    dayLookup,
  };
};

export const addEventToSeasonDay = ({ dayLookup, weekNumber, dayOfWeek, event }) => {
  const day = dayLookup.get(buildLookupKey(weekNumber, dayOfWeek));
  if (!day) return false;

  day.events.push(event);
  return true;
};

export const sortSeasonEvents = (season) => {
  season.days.forEach((day) => {
    day.events.sort((leftEvent, rightEvent) => {
      const leftPriority = EVENT_PRIORITY[leftEvent.type] ?? 99;
      const rightPriority = EVENT_PRIORITY[rightEvent.type] ?? 99;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return String(leftEvent.label ?? "").localeCompare(String(rightEvent.label ?? ""));
    });
  });
};
