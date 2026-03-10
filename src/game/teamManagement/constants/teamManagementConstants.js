export const TEAM_MANAGEMENT_SLOT_LAYOUT = Object.freeze([
  Object.freeze({
    id: "defender-1",
    label: "Left DF",
    roleGroup: "DF",
    roleLabel: "Defender",
    topPercent: 24,
    leftPercent: 35,
  }),
  Object.freeze({
    id: "defender-2",
    label: "Right DF",
    roleGroup: "DF",
    roleLabel: "Defender",
    topPercent: 76,
    leftPercent: 35,
  }),
  Object.freeze({
    id: "midfielder-1",
    label: "Left MD",
    roleGroup: "MD",
    roleLabel: "Midfielder",
    topPercent: 18,
    leftPercent: 58,
  }),
  Object.freeze({
    id: "midfielder-2",
    label: "Right MD",
    roleGroup: "MD",
    roleLabel: "Midfielder",
    topPercent: 82,
    leftPercent: 58,
  }),
  Object.freeze({
    id: "attacker-1",
    label: "Left AT",
    roleGroup: "AT",
    roleLabel: "Attacker",
    topPercent: 30,
    leftPercent: 81,
  }),
  Object.freeze({
    id: "attacker-2",
    label: "Right AT",
    roleGroup: "AT",
    roleLabel: "Attacker",
    topPercent: 70,
    leftPercent: 81,
  }),
]);

export const DEFENSIVE_WIDTH_OPTIONS = Object.freeze(["Wide", "Normal", "Narrow"]);
export const ATTACKING_WIDTH_OPTIONS = Object.freeze(["Wide", "Normal", "Narrow"]);

export const DEFENSIVE_TACTIC_OPTIONS = Object.freeze([
  "Low Block",
  "Mid Block",
  "High Press",
  "Offside Trap",
  "Zonal",
]);

export const ATTACKING_TACTIC_OPTIONS = Object.freeze([
  "Posession",
  "Long Ball",
  "Wing Play",
  "Counter",
  "Direct",
]);

export const TACTIC_SKILLS = Object.freeze([
  "Tackling",
  "Marking",
  "Passing",
  "Movement",
  "Control",
  "Dribbling",
  "Shooting",
]);

export const TEAM_MANAGEMENT_DEFAULT_TACTICS = Object.freeze({
  defensiveWidth: "Normal",
  defensiveTactic: "Mid Block",
  attackingWidth: "Normal",
  attackingTactic: "Posession",
});

export const TACTIC_COMPATIBILITY_MATRIX = Object.freeze({
  "Low Block": Object.freeze({
    Posession: 10,
    "Long Ball": 30,
    "Wing Play": 10,
    Counter: 30,
    Direct: 20,
  }),
  "Mid Block": Object.freeze({
    Posession: 20,
    "Long Ball": 20,
    "Wing Play": 30,
    Counter: 10,
    Direct: 20,
  }),
  "High Press": Object.freeze({
    Posession: 30,
    "Long Ball": 10,
    "Wing Play": 20,
    Counter: 30,
    Direct: 10,
  }),
  "Offside Trap": Object.freeze({
    Posession: 10,
    "Long Ball": 30,
    "Wing Play": 30,
    Counter: 10,
    Direct: 20,
  }),
  Zonal: Object.freeze({
    Posession: 30,
    "Long Ball": 10,
    "Wing Play": 10,
    Counter: 20,
    Direct: 30,
  }),
});
