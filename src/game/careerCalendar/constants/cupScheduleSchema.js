import { CALENDAR_EVENT_TYPES, DAY_INDEX } from "./calendarConstants";

export const LEAGUE_CUP_DRAW_SLOTS = Object.freeze([
  Object.freeze({
    id: "league-cup-draw-round-1",
    weekNumber: 1,
    dayOfWeek: DAY_INDEX.THURSDAY,
    stageLabel: "Round 1 Draw",
  }),
  Object.freeze({
    id: "league-cup-draw-round-2",
    weekNumber: 4,
    dayOfWeek: DAY_INDEX.THURSDAY,
    stageLabel: "Round 2 Draw",
  }),
  Object.freeze({
    id: "league-cup-draw-quarter-final",
    weekNumber: 7,
    dayOfWeek: DAY_INDEX.THURSDAY,
    stageLabel: "Quarter-final Draw",
  }),
  Object.freeze({
    id: "league-cup-draw-semi-final",
    weekNumber: 11,
    dayOfWeek: DAY_INDEX.THURSDAY,
    stageLabel: "Semi-final Draw",
  }),
  Object.freeze({
    id: "league-cup-draw-final",
    weekNumber: 15,
    dayOfWeek: DAY_INDEX.THURSDAY,
    stageLabel: "Final Draw",
  }),
]);

export const LEAGUE_CUP_MATCH_SLOTS = Object.freeze([
  Object.freeze({
    id: "league-cup-round-1",
    weekNumber: 2,
    dayOfWeek: DAY_INDEX.WEDNESDAY,
    stageLabel: "Round 1",
    eventType: CALENDAR_EVENT_TYPES.CUP_MATCH,
  }),
  Object.freeze({
    id: "league-cup-round-2",
    weekNumber: 5,
    dayOfWeek: DAY_INDEX.WEDNESDAY,
    stageLabel: "Round 2",
    eventType: CALENDAR_EVENT_TYPES.CUP_MATCH,
  }),
  Object.freeze({
    id: "league-cup-quarter-final",
    weekNumber: 8,
    dayOfWeek: DAY_INDEX.SATURDAY,
    stageLabel: "Quarter-final",
    eventType: CALENDAR_EVENT_TYPES.CUP_MATCH,
  }),
  Object.freeze({
    id: "league-cup-semi-final",
    weekNumber: 12,
    dayOfWeek: DAY_INDEX.WEDNESDAY,
    stageLabel: "Semi-final",
    eventType: CALENDAR_EVENT_TYPES.CUP_MATCH,
  }),
  Object.freeze({
    id: "league-cup-final",
    weekNumber: 16,
    dayOfWeek: DAY_INDEX.WEDNESDAY,
    stageLabel: "Final",
    eventType: CALENDAR_EVENT_TYPES.FINAL,
  }),
]);

export const CHAMPIONS_CUP_MATCH_SLOTS = Object.freeze([
  Object.freeze({
    id: "champions-cup-group-md-1",
    weekNumber: 1,
    dayOfWeek: DAY_INDEX.WEDNESDAY,
    stageLabel: "Group Matchday 1",
    eventType: CALENDAR_EVENT_TYPES.CUP_MATCH,
  }),
  Object.freeze({
    id: "champions-cup-group-md-2",
    weekNumber: 4,
    dayOfWeek: DAY_INDEX.WEDNESDAY,
    stageLabel: "Group Matchday 2",
    eventType: CALENDAR_EVENT_TYPES.CUP_MATCH,
  }),
  Object.freeze({
    id: "champions-cup-group-md-3",
    weekNumber: 8,
    dayOfWeek: DAY_INDEX.WEDNESDAY,
    stageLabel: "Group Matchday 3",
    eventType: CALENDAR_EVENT_TYPES.CUP_MATCH,
  }),
  Object.freeze({
    id: "champions-cup-quarter-finals",
    weekNumber: 11,
    dayOfWeek: DAY_INDEX.WEDNESDAY,
    stageLabel: "Quarter-finals",
    eventType: CALENDAR_EVENT_TYPES.CUP_MATCH,
  }),
  Object.freeze({
    id: "champions-cup-semi-finals",
    weekNumber: 14,
    dayOfWeek: DAY_INDEX.WEDNESDAY,
    stageLabel: "Semi-finals",
    eventType: CALENDAR_EVENT_TYPES.CUP_MATCH,
  }),
  Object.freeze({
    id: "champions-cup-final",
    weekNumber: 16,
    dayOfWeek: DAY_INDEX.SATURDAY,
    stageLabel: "Final",
    eventType: CALENDAR_EVENT_TYPES.FINAL,
  }),
]);

export const CHAMPIONS_CUP_DRAW_SLOTS = Object.freeze([
  Object.freeze({
    id: "champions-cup-draw-groups",
    stageKey: "group-md-1",
    weekNumber: 1,
    dayOfWeek: DAY_INDEX.MONDAY,
    stageLabel: "Group Draw",
  }),
  Object.freeze({
    id: "champions-cup-draw-quarter-finals",
    stageKey: "quarter-finals",
    weekNumber: 10,
    dayOfWeek: DAY_INDEX.THURSDAY,
    stageLabel: "Quarter-finals Draw",
  }),
  Object.freeze({
    id: "champions-cup-draw-semi-finals",
    stageKey: "semi-finals",
    weekNumber: 13,
    dayOfWeek: DAY_INDEX.THURSDAY,
    stageLabel: "Semi-finals Draw",
  }),
  Object.freeze({
    id: "champions-cup-draw-final",
    stageKey: "final",
    weekNumber: 16,
    dayOfWeek: DAY_INDEX.THURSDAY,
    stageLabel: "Final Draw",
  }),
]);

export const CHAMPIONS_CUP_GROUP_IDS = Object.freeze(["A", "B", "C", "D"]);

export const CHAMPIONS_CUP_QUARTER_FINAL_PAIRINGS = Object.freeze([
  Object.freeze({
    id: "QF1",
    home: "Winner Group A",
    away: "Runner-up Group D",
  }),
  Object.freeze({
    id: "QF2",
    home: "Winner Group B",
    away: "Runner-up Group C",
  }),
  Object.freeze({
    id: "QF3",
    home: "Winner Group C",
    away: "Runner-up Group B",
  }),
  Object.freeze({
    id: "QF4",
    home: "Winner Group D",
    away: "Runner-up Group A",
  }),
]);
