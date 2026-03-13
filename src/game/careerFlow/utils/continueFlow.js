import { CALENDAR_EVENT_TYPES, MATCH_EVENT_TYPES } from "../../careerCalendar/constants/calendarConstants";

export const CONTINUE_FLOW_ACTIONS = Object.freeze({
  NEXT_DAY: "next_day",
  MATCH: "match",
  MATCH_DAY_RESULTS: "match_day_results",
  SCOUTING_REPORT: "scouting_report",
  TEAM_SETUP: "team_setup",
  LEAGUE_FIXTURE_GENERATION: "league_fixture_generation",
  LEAGUE_CUP_DRAW: "league_cup_draw",
  CHAMPIONS_CUP_DRAW: "champions_cup_draw",
  CUP_DRAW: "cup_draw",
  FINISH_SEASON: "finish_season",
  SIMULATING: "simulating",
});

const CONTINUE_FLOW_LABELS = Object.freeze({
  [CONTINUE_FLOW_ACTIONS.NEXT_DAY]: "Continue to Next Day",
  [CONTINUE_FLOW_ACTIONS.MATCH]: "Continue to Match",
  [CONTINUE_FLOW_ACTIONS.MATCH_DAY_RESULTS]: "Continue to Match Day Results",
  [CONTINUE_FLOW_ACTIONS.SCOUTING_REPORT]: "View Scouting Report",
  [CONTINUE_FLOW_ACTIONS.TEAM_SETUP]: "Continue to Team Setup",
  [CONTINUE_FLOW_ACTIONS.LEAGUE_FIXTURE_GENERATION]: "Continue to League Fixture Generation",
  [CONTINUE_FLOW_ACTIONS.LEAGUE_CUP_DRAW]: "Continue to League Cup Draw",
  [CONTINUE_FLOW_ACTIONS.CHAMPIONS_CUP_DRAW]: "Continue to Champions Cup Draw",
  [CONTINUE_FLOW_ACTIONS.CUP_DRAW]: "Continue to Cup Draw",
  [CONTINUE_FLOW_ACTIONS.FINISH_SEASON]: "Finish Season",
  [CONTINUE_FLOW_ACTIONS.SIMULATING]: "Simulating Match Day...",
});

const hasMatchEvent = (day) => {
  const events = Array.isArray(day?.events) ? day.events : [];
  return events.some((event) => MATCH_EVENT_TYPES.includes(event?.type));
};

const getCupDrawCompetitionIds = (day) => {
  const events = Array.isArray(day?.events) ? day.events : [];
  return events
    .filter((event) => event?.type === CALENDAR_EVENT_TYPES.CUP_DRAW)
    .map((event) => String(event?.competitionId ?? "").trim())
    .filter(Boolean);
};

export const getContinueFlowLabel = (action) =>
  CONTINUE_FLOW_LABELS[action] ?? "Continue";

export const resolveCareerHomeContinueAction = ({
  isSeasonComplete,
  isSimulatingDay,
  isScoutingReportDue,
  hasPlayerMatchToday,
  currentDay,
  isDayOneSetupGateActive,
  seasonFixturesRevealed,
}) => {
  if (isSimulatingDay) {
    return CONTINUE_FLOW_ACTIONS.SIMULATING;
  }

  if (isScoutingReportDue) {
    return CONTINUE_FLOW_ACTIONS.SCOUTING_REPORT;
  }

  if (isSeasonComplete) {
    return CONTINUE_FLOW_ACTIONS.FINISH_SEASON;
  }

  if (isDayOneSetupGateActive) {
    return CONTINUE_FLOW_ACTIONS.TEAM_SETUP;
  }

  if (hasPlayerMatchToday) {
    return CONTINUE_FLOW_ACTIONS.MATCH;
  }

  if (Number(currentDay?.dayOfSeason) === 1 && !seasonFixturesRevealed) {
    return CONTINUE_FLOW_ACTIONS.LEAGUE_FIXTURE_GENERATION;
  }

  const cupDrawCompetitionIds = getCupDrawCompetitionIds(currentDay);
  if (cupDrawCompetitionIds.includes("champions-cup")) {
    return CONTINUE_FLOW_ACTIONS.CHAMPIONS_CUP_DRAW;
  }
  if (cupDrawCompetitionIds.includes("league-cup")) {
    return CONTINUE_FLOW_ACTIONS.LEAGUE_CUP_DRAW;
  }
  if (cupDrawCompetitionIds.length > 0) {
    return CONTINUE_FLOW_ACTIONS.CUP_DRAW;
  }

  if (hasMatchEvent(currentDay)) {
    return CONTINUE_FLOW_ACTIONS.MATCH_DAY_RESULTS;
  }

  return CONTINUE_FLOW_ACTIONS.NEXT_DAY;
};

export const resolveCupDrawContinueAction = ({
  hasPendingDayResults,
  isDayOneSetupGateActive,
}) => {
  if (hasPendingDayResults) {
    return CONTINUE_FLOW_ACTIONS.MATCH_DAY_RESULTS;
  }
  if (isDayOneSetupGateActive) {
    return CONTINUE_FLOW_ACTIONS.TEAM_SETUP;
  }
  return CONTINUE_FLOW_ACTIONS.NEXT_DAY;
};

export const resolveDayResultsContinueAction = ({ isDayOneSetupGateActive }) => {
  if (isDayOneSetupGateActive) {
    return CONTINUE_FLOW_ACTIONS.TEAM_SETUP;
  }
  return CONTINUE_FLOW_ACTIONS.NEXT_DAY;
};
