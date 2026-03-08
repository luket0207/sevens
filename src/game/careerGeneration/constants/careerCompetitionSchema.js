export const CAREER_COMPETITION_SCHEMA = Object.freeze([
  Object.freeze({
    id: "league-5",
    name: "League 5",
    type: "domestic",
    teamCount: 7,
    minOverall: 20,
    maxOverall: 25,
  }),
  Object.freeze({
    id: "league-4",
    name: "League 4",
    type: "domestic",
    teamCount: 8,
    minOverall: 25,
    maxOverall: 30,
  }),
  Object.freeze({
    id: "league-3",
    name: "League 3",
    type: "domestic",
    teamCount: 8,
    minOverall: 30,
    maxOverall: 35,
  }),
  Object.freeze({
    id: "league-2",
    name: "League 2",
    type: "domestic",
    teamCount: 8,
    minOverall: 35,
    maxOverall: 40,
  }),
  Object.freeze({
    id: "league-1",
    name: "League 1",
    type: "domestic",
    teamCount: 8,
    minOverall: 40,
    maxOverall: 45,
  }),
  Object.freeze({
    id: "foreign-champions-cup",
    name: "Foreign Champions Cup",
    type: "foreign",
    teamCount: 7,
    minOverall: 40,
    maxOverall: 50,
  }),
]);

export const PLAYERS_PER_TEAM = 7;

export const CAREER_TOTAL_AI_TEAMS = CAREER_COMPETITION_SCHEMA.reduce(
  (total, competition) => total + competition.teamCount,
  0
);

export const CAREER_TOTAL_AI_PLAYERS = CAREER_TOTAL_AI_TEAMS * PLAYERS_PER_TEAM;

