export const DOMESTIC_LEAGUE_IDS = Object.freeze([
  "league-5",
  "league-4",
  "league-3",
  "league-2",
  "league-1",
]);

export const LEAGUE_ID_TO_NAME = Object.freeze({
  "league-5": "League 5",
  "league-4": "League 4",
  "league-3": "League 3",
  "league-2": "League 2",
  "league-1": "League 1",
});

export const LEAGUE_MATCH_WEEKS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]);

export const DAY_INDEX = Object.freeze({
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
});

export const LEAGUE_MATCH_DAY_OPTIONS = Object.freeze([DAY_INDEX.SATURDAY, DAY_INDEX.SUNDAY]);

export const FIXTURE_TYPES = Object.freeze({
  LEAGUE: "league",
  LEAGUE_CUP: "league_cup",
  CHAMPIONS_CUP: "champions_cup",
  PLAYOFF: "playoff",
});

export const FIXTURE_STATUS = Object.freeze({
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
});

export const MRD_OUTCOME_TYPES = Object.freeze({
  LOWER_BIG_WIN: "lower_big_win",
  LOWER_WIN: "lower_win",
  DRAW: "draw",
  HIGHER_WIN: "higher_win",
  HIGHER_BIG_WIN: "higher_big_win",
});

export const MRD_RESULT_MATRIX = Object.freeze([
  Object.freeze({
    id: "0-4",
    minExclusive: -1,
    maxInclusive: 4,
    probabilities: Object.freeze({
      [MRD_OUTCOME_TYPES.LOWER_BIG_WIN]: 5,
      [MRD_OUTCOME_TYPES.LOWER_WIN]: 35,
      [MRD_OUTCOME_TYPES.DRAW]: 20,
      [MRD_OUTCOME_TYPES.HIGHER_WIN]: 35,
      [MRD_OUTCOME_TYPES.HIGHER_BIG_WIN]: 5,
    }),
  }),
  Object.freeze({
    id: "5-8",
    minExclusive: 4,
    maxInclusive: 8,
    probabilities: Object.freeze({
      [MRD_OUTCOME_TYPES.LOWER_BIG_WIN]: 5,
      [MRD_OUTCOME_TYPES.LOWER_WIN]: 35,
      [MRD_OUTCOME_TYPES.DRAW]: 17,
      [MRD_OUTCOME_TYPES.HIGHER_WIN]: 38,
      [MRD_OUTCOME_TYPES.HIGHER_BIG_WIN]: 5,
    }),
  }),
  Object.freeze({
    id: "9-16",
    minExclusive: 8,
    maxInclusive: 16,
    probabilities: Object.freeze({
      [MRD_OUTCOME_TYPES.LOWER_BIG_WIN]: 3,
      [MRD_OUTCOME_TYPES.LOWER_WIN]: 25,
      [MRD_OUTCOME_TYPES.DRAW]: 12,
      [MRD_OUTCOME_TYPES.HIGHER_WIN]: 50,
      [MRD_OUTCOME_TYPES.HIGHER_BIG_WIN]: 10,
    }),
  }),
  Object.freeze({
    id: "17-26",
    minExclusive: 16,
    maxInclusive: 26,
    probabilities: Object.freeze({
      [MRD_OUTCOME_TYPES.LOWER_BIG_WIN]: 2,
      [MRD_OUTCOME_TYPES.LOWER_WIN]: 20,
      [MRD_OUTCOME_TYPES.DRAW]: 10,
      [MRD_OUTCOME_TYPES.HIGHER_WIN]: 56,
      [MRD_OUTCOME_TYPES.HIGHER_BIG_WIN]: 12,
    }),
  }),
  Object.freeze({
    id: "27-40",
    minExclusive: 26,
    maxInclusive: 40,
    probabilities: Object.freeze({
      [MRD_OUTCOME_TYPES.LOWER_BIG_WIN]: 1,
      [MRD_OUTCOME_TYPES.LOWER_WIN]: 17,
      [MRD_OUTCOME_TYPES.DRAW]: 10,
      [MRD_OUTCOME_TYPES.HIGHER_WIN]: 58,
      [MRD_OUTCOME_TYPES.HIGHER_BIG_WIN]: 14,
    }),
  }),
  Object.freeze({
    id: "41-55",
    minExclusive: 40,
    maxInclusive: 55,
    probabilities: Object.freeze({
      [MRD_OUTCOME_TYPES.LOWER_BIG_WIN]: 1,
      [MRD_OUTCOME_TYPES.LOWER_WIN]: 14,
      [MRD_OUTCOME_TYPES.DRAW]: 10,
      [MRD_OUTCOME_TYPES.HIGHER_WIN]: 60,
      [MRD_OUTCOME_TYPES.HIGHER_BIG_WIN]: 15,
    }),
  }),
  Object.freeze({
    id: "56-72",
    minExclusive: 55,
    maxInclusive: 72,
    probabilities: Object.freeze({
      [MRD_OUTCOME_TYPES.LOWER_BIG_WIN]: 0.2,
      [MRD_OUTCOME_TYPES.LOWER_WIN]: 5.3,
      [MRD_OUTCOME_TYPES.DRAW]: 7.5,
      [MRD_OUTCOME_TYPES.HIGHER_WIN]: 69,
      [MRD_OUTCOME_TYPES.HIGHER_BIG_WIN]: 18,
    }),
  }),
  Object.freeze({
    id: "73-99",
    minExclusive: 72,
    maxInclusive: 99,
    probabilities: Object.freeze({
      [MRD_OUTCOME_TYPES.LOWER_BIG_WIN]: 0.1,
      [MRD_OUTCOME_TYPES.LOWER_WIN]: 1.8,
      [MRD_OUTCOME_TYPES.DRAW]: 3.6,
      [MRD_OUTCOME_TYPES.HIGHER_WIN]: 74.5,
      [MRD_OUTCOME_TYPES.HIGHER_BIG_WIN]: 20,
    }),
  }),
  Object.freeze({
    id: "100+",
    minExclusive: 99,
    maxInclusive: Number.POSITIVE_INFINITY,
    probabilities: Object.freeze({
      [MRD_OUTCOME_TYPES.LOWER_BIG_WIN]: 0,
      [MRD_OUTCOME_TYPES.LOWER_WIN]: 0.8,
      [MRD_OUTCOME_TYPES.DRAW]: 2.8,
      [MRD_OUTCOME_TYPES.HIGHER_WIN]: 56.4,
      [MRD_OUTCOME_TYPES.HIGHER_BIG_WIN]: 40,
    }),
  }),
]);

export const LEAGUE_CUP_STAGE_ORDER = Object.freeze([
  "round-1",
  "round-2",
  "quarter-final",
  "semi-final",
  "final",
]);

export const CHAMPIONS_CUP_GROUP_ORDER = Object.freeze(["A", "B", "C", "D"]);

export const CHAMPIONS_CUP_STAGE_ORDER = Object.freeze([
  "group-md-1",
  "group-md-2",
  "group-md-3",
  "quarter-finals",
  "semi-finals",
  "final",
]);
