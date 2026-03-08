export const PLAYER_GENERATION_TYPES = Object.freeze({
  GOALKEEPER: "GK",
  OUTFIELD: "OUTFIELD",
});

export const PLAYER_OVERALL_RANGE = Object.freeze({
  min: 1,
  max: 50,
});

export const PLAYER_SKILL_RANGE = Object.freeze({
  min: 1,
  max: 100,
});

export const GOALKEEPER_SKILLS = Object.freeze(["Shot Stopping", "Distribution", "Control"]);

export const OUTFIELD_SKILLS = Object.freeze([
  "Tackling",
  "Marking",
  "Passing",
  "Movement",
  "Control",
  "Dribbling",
  "Shooting",
]);

export const NO_INFLUENCE_RULE = "No Influence";
export const FORCED_INFLUENCE_RULE_NONE = "None";

export const OUTFIELD_INFLUENCE_RULES = Object.freeze([
  NO_INFLUENCE_RULE,
  "Influence Defender",
  "Influence Defensive Mid",
  "Influence Attacking Mid",
  "Influence Attacker",
  "Influence Goalscorer",
]);

export const OUTFIELD_INFLUENCE_DEFINITIONS = Object.freeze({
  [NO_INFLUENCE_RULE]: Object.freeze({
    takeFrom: Object.freeze([]),
    giveTo: Object.freeze([]),
  }),
  "Influence Defender": Object.freeze({
    takeFrom: Object.freeze(["Dribbling", "Shooting"]),
    giveTo: Object.freeze(["Tackling", "Marking", "Control"]),
  }),
  "Influence Defensive Mid": Object.freeze({
    takeFrom: Object.freeze(["Dribbling", "Shooting", "Movement"]),
    giveTo: Object.freeze(["Passing", "Control", "Tackling", "Marking"]),
  }),
  "Influence Attacking Mid": Object.freeze({
    takeFrom: Object.freeze(["Tackling", "Marking"]),
    giveTo: Object.freeze(["Passing", "Control", "Movement"]),
  }),
  "Influence Attacker": Object.freeze({
    takeFrom: Object.freeze(["Tackling", "Marking"]),
    giveTo: Object.freeze(["Movement", "Control", "Dribbling", "Shooting"]),
  }),
  "Influence Goalscorer": Object.freeze({
    takeFrom: Object.freeze(["Passing", "Tackling", "Marking"]),
    giveTo: Object.freeze(["Movement", "Shooting"]),
  }),
});

export const INFLUENCE_TRANSFER_COUNT_RANGE = Object.freeze({
  min: 2,
  max: 4,
});

export const BASE_SPREAD_CONFIG = Object.freeze({
  GK: Object.freeze({
    transferCountMin: 3,
    transferCountMax: 6,
    transferSizeMin: 1,
    transferSizeMax: 4,
  }),
  OUTFIELD: Object.freeze({
    transferCountMin: 6,
    transferCountMax: 12,
    transferSizeMin: 1,
    transferSizeMax: 4,
  }),
});

export const INFLUENCE_TRANSFER_SIZE_BANDS = Object.freeze([
  Object.freeze({ chance: 0.7, min: 5, max: 8 }),
  Object.freeze({ chance: 0.25, min: 9, max: 12 }),
  Object.freeze({ chance: 0.05, min: 13, max: 20 }),
]);
