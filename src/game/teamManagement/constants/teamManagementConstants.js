export const TEAM_MANAGEMENT_SLOT_LAYOUT = Object.freeze([
  Object.freeze({
    id: "defender-1",
    label: "Defender 1",
    roleGroup: "DF",
    roleLabel: "Defender",
    topPercent: 64,
    leftPercent: 30,
  }),
  Object.freeze({
    id: "defender-2",
    label: "Defender 2",
    roleGroup: "DF",
    roleLabel: "Defender",
    topPercent: 64,
    leftPercent: 70,
  }),
  Object.freeze({
    id: "midfielder-1",
    label: "Midfielder 1",
    roleGroup: "MD",
    roleLabel: "Midfielder",
    topPercent: 42,
    leftPercent: 30,
  }),
  Object.freeze({
    id: "midfielder-2",
    label: "Midfielder 2",
    roleGroup: "MD",
    roleLabel: "Midfielder",
    topPercent: 42,
    leftPercent: 70,
  }),
  Object.freeze({
    id: "attacker-1",
    label: "Attacker 1",
    roleGroup: "AT",
    roleLabel: "Attacker",
    topPercent: 22,
    leftPercent: 30,
  }),
  Object.freeze({
    id: "attacker-2",
    label: "Attacker 2",
    roleGroup: "AT",
    roleLabel: "Attacker",
    topPercent: 22,
    leftPercent: 70,
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
