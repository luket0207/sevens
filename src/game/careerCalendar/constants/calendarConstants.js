export const SEASON_MONTH_COUNT = 4;
export const WEEKS_PER_MONTH = 4;
export const DAYS_PER_WEEK = 7;

export const SEASON_WEEK_COUNT = SEASON_MONTH_COUNT * WEEKS_PER_MONTH;
export const SEASON_DAY_COUNT = SEASON_WEEK_COUNT * DAYS_PER_WEEK;

export const MONTH_LABELS = Object.freeze(["Month 1", "Month 2", "Month 3", "Month 4"]);

export const DAY_LABELS = Object.freeze([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

export const DAY_SHORT_LABELS = Object.freeze(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

export const DAY_INDEX = Object.freeze({
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
});

export const CALENDAR_EVENT_TYPES = Object.freeze({
  LEAGUE_MATCH: "league_match",
  CUP_MATCH: "cup_match",
  CUP_DRAW: "cup_draw",
  PLAYOFF_MATCH: "playoff_match",
  FINAL: "final",
});

export const MATCH_EVENT_TYPES = Object.freeze([
  CALENDAR_EVENT_TYPES.LEAGUE_MATCH,
  CALENDAR_EVENT_TYPES.CUP_MATCH,
  CALENDAR_EVENT_TYPES.PLAYOFF_MATCH,
  CALENDAR_EVENT_TYPES.FINAL,
]);
