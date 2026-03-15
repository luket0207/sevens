import { randomInt } from "../../../engine/utils/rng/rng";

const PENALTY_GOAL_TIMING = Object.freeze({
  takerRunMs: 420,
  ballTravelMs: 560,
  goalPauseMs: 300,
  goalBannerMs: 900,
});

const HOME_OUTFIELD_SHIRT = Object.freeze({
  pattern: "solid",
  mainColour: "#115752",
  detailColour: "#f4e7bc",
});

const AWAY_OUTFIELD_SHIRT = Object.freeze({
  pattern: "vertical-stripes",
  mainColour: "#e8ecef",
  detailColour: "#20313e",
});

const HOME_GOALKEEPER_SHIRT = Object.freeze({
  pattern: "solid",
  mainColour: "#f97316",
  detailColour: "#fff4d6",
});

const AWAY_GOALKEEPER_SHIRT = Object.freeze({
  pattern: "solid",
  mainColour: "#facc15",
  detailColour: "#201a06",
});

const createPenaltyScenePlayers = () => [
  { id: "home-gk", side: "home", role: "GK", label: "GK", x: 6, y: 50, shirt: HOME_GOALKEEPER_SHIRT },
  { id: "home-df-1", side: "home", role: "DF", label: "DF", x: 26, y: 35, shirt: HOME_OUTFIELD_SHIRT },
  { id: "home-df-2", side: "home", role: "DF", label: "DF", x: 26, y: 65, shirt: HOME_OUTFIELD_SHIRT },
  { id: "home-md-1", side: "home", role: "MD", label: "MD", x: 44, y: 33, shirt: HOME_OUTFIELD_SHIRT },
  { id: "home-md-2", side: "home", role: "MD", label: "MD", x: 48, y: 67, shirt: HOME_OUTFIELD_SHIRT },
  { id: "home-at-1", side: "home", role: "AT", label: "AT", x: 70, y: 42, shirt: HOME_OUTFIELD_SHIRT },
  {
    id: "home-penalty-taker",
    side: "home",
    role: "AT",
    label: "PK",
    x: 81.5,
    y: 50,
    shirt: HOME_OUTFIELD_SHIRT,
    isPenaltyTaker: true,
  },
  { id: "away-gk", side: "away", role: "GK", label: "GK", x: 94, y: 50, shirt: AWAY_GOALKEEPER_SHIRT, isGoalkeeper: true },
  { id: "away-df-1", side: "away", role: "DF", label: "DF", x: 71, y: 31, shirt: AWAY_OUTFIELD_SHIRT },
  { id: "away-df-2", side: "away", role: "DF", label: "DF", x: 71, y: 69, shirt: AWAY_OUTFIELD_SHIRT },
  { id: "away-md-1", side: "away", role: "MD", label: "MD", x: 76, y: 39, shirt: AWAY_OUTFIELD_SHIRT },
  { id: "away-md-2", side: "away", role: "MD", label: "MD", x: 76, y: 61, shirt: AWAY_OUTFIELD_SHIRT },
  { id: "away-at-1", side: "away", role: "AT", label: "AT", x: 81, y: 43, shirt: AWAY_OUTFIELD_SHIRT },
  { id: "away-at-2", side: "away", role: "AT", label: "AT", x: 81, y: 57, shirt: AWAY_OUTFIELD_SHIRT },
];

export const createPenaltyGoalPlayback = () => {
  const createdAtMs = Date.now();
  const stallMs = randomInt(500, 1500);
  const shotSide = randomInt(0, 1) === 0 ? "left" : "right";
  const durationMs =
    stallMs +
    PENALTY_GOAL_TIMING.takerRunMs +
    PENALTY_GOAL_TIMING.ballTravelMs +
    PENALTY_GOAL_TIMING.goalPauseMs +
    PENALTY_GOAL_TIMING.goalBannerMs;

  return {
    id: `penalty-goal-${Date.now()}-${randomInt(100, 999)}`,
    key: "penalty-goal",
    label: "PenaltyGoal",
    description: "Prototype goal animation for a home-team penalty.",
    durationMs,
    createdAtMs,
    createdAtIso: new Date(createdAtMs).toISOString(),
    expectedCloseAtIso: new Date(createdAtMs + durationMs).toISOString(),
    stallMs,
    shotSide,
    timing: { ...PENALTY_GOAL_TIMING },
    players: createPenaltyScenePlayers(),
    takerMovement: {
      start: { x: 81.5, y: 50 },
      end: { x: 85.5, y: 50 },
    },
    ballPath: {
      start: { x: 87, y: 50 },
      end: {
        x: 98,
        y: shotSide === "left" ? 42 : 58,
      },
    },
  };
};

export const ANIMATION_TEST_DEFINITIONS = Object.freeze([
  {
    id: "penalty-goal",
    label: "PenaltyGoal",
    summary: "Home penalty prototype with random stall timing and random finish side.",
    createPlayback: createPenaltyGoalPlayback,
  },
]);
