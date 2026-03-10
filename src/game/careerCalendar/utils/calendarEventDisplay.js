import {
  faArrowUpWideShort,
  faBoxOpen,
  faListOl,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { CALENDAR_EVENT_TYPES, MATCH_EVENT_TYPES } from "../constants/calendarConstants";

const CALENDAR_EVENT_VISUALS = Object.freeze({
  leagueMatch: Object.freeze({
    visualKey: "leagueMatch",
    icon: faListOl,
    ariaLabel: "League Match",
  }),
  leagueCupMatch: Object.freeze({
    visualKey: "leagueCupMatch",
    icon: faTrophy,
    ariaLabel: "League Cup Match",
  }),
  championsCupMatch: Object.freeze({
    visualKey: "championsCupMatch",
    icon: faTrophy,
    ariaLabel: "Champions Cup Match",
  }),
  leagueCupDraw: Object.freeze({
    visualKey: "leagueCupDraw",
    icon: faBoxOpen,
    ariaLabel: "League Cup Draw",
  }),
  championsCupDraw: Object.freeze({
    visualKey: "championsCupDraw",
    icon: faBoxOpen,
    ariaLabel: "Champions Cup Draw",
  }),
  leagueCupFinal: Object.freeze({
    visualKey: "leagueCupFinal",
    icon: faTrophy,
    ariaLabel: "League Cup Final",
  }),
  championsCupFinal: Object.freeze({
    visualKey: "championsCupFinal",
    icon: faTrophy,
    ariaLabel: "Champions Cup Final",
  }),
  playoff: Object.freeze({
    visualKey: "playoff",
    icon: faArrowUpWideShort,
    ariaLabel: "Playoff",
  }),
});

const normaliseText = (value) => String(value ?? "").trim().toLowerCase();

const isPlaceholderOpponent = (value) => {
  const safeValue = normaliseText(value);
  return (
    !safeValue ||
    safeValue === "tbd" ||
    safeValue.includes("tbd") ||
    safeValue === "various" ||
    safeValue.includes("2nd vs 3rd") ||
    safeValue.includes("2nd v 3rd")
  );
};

const isCupCompetition = (competitionId) => ["league-cup", "champions-cup"].includes(competitionId);

const isPlayerInCupCompetition = ({ simulationState, competitionId, playerTeamId }) => {
  if (!competitionId || !playerTeamId || !isCupCompetition(competitionId)) {
    return false;
  }

  if (competitionId === "league-cup") {
    const participants = simulationState?.cups?.competitions?.leagueCup?.participants ?? [];
    return participants.includes(playerTeamId);
  }

  if (competitionId === "champions-cup") {
    const participants = simulationState?.cups?.competitions?.championsCup?.participantTeamIds ?? [];
    return participants.includes(playerTeamId);
  }

  return false;
};

const resolveKnownCupFinalFixture = ({ simulationState, competitionId }) => {
  const competitionKey = competitionId === "champions-cup" ? "championsCup" : "leagueCup";
  const finalFixtureIds =
    simulationState?.cups?.competitions?.[competitionKey]?.stageMeta?.final?.fixtureIds ?? [];
  const fixturesById = simulationState?.cups?.fixturesById ?? {};

  return finalFixtureIds
    .map((fixtureId) => fixturesById[fixtureId])
    .find((fixture) => fixture?.homeTeamName && fixture?.awayTeamName);
};

const resolvePlayerCupFixtureForDay = ({
  simulationState,
  dayAbsoluteDayIndex,
  competitionId,
  playerTeamId,
}) => {
  const dayKey = String(dayAbsoluteDayIndex);
  const fixtureIds = simulationState?.cups?.fixtureIdsByDay?.[dayKey] ?? [];
  const fixturesById = simulationState?.cups?.fixturesById ?? {};

  return fixtureIds
    .map((fixtureId) => fixturesById[fixtureId])
    .find((fixture) => {
      if (!fixture || fixture.competitionId !== competitionId) {
        return false;
      }
      return fixture.homeTeamId === playerTeamId || fixture.awayTeamId === playerTeamId;
    });
};

const resolveOpponentLabel = ({ fixture, playerTeamId }) => {
  if (!fixture || !playerTeamId) {
    return "";
  }

  if (fixture.homeTeamId === playerTeamId) {
    return `vs ${fixture.awayTeamName}`;
  }
  if (fixture.awayTeamId === playerTeamId) {
    return `at ${fixture.homeTeamName}`;
  }

  return "";
};

const normaliseOpponentTooltipText = ({ opponentText, isHome }) => {
  const safeOpponent = String(opponentText ?? "").trim();
  if (!safeOpponent || isPlaceholderOpponent(safeOpponent)) {
    return "";
  }

  const safeLowerOpponent = safeOpponent.toLowerCase();
  if (safeLowerOpponent.startsWith("vs ") || safeLowerOpponent.startsWith("at ")) {
    return safeOpponent;
  }

  if (safeLowerOpponent.includes(" vs ") || safeLowerOpponent.includes(" v ")) {
    return safeOpponent.replace(/\s+vs\s+/i, " v ");
  }

  return isHome ? `vs ${safeOpponent}` : `at ${safeOpponent}`;
};

const resolvePlayoffTooltip = ({ event, simulationState }) => {
  const competitionId = String(event?.competitionId ?? "").trim();
  const playoffSuffix = "-playoff";
  const leagueId = competitionId.endsWith(playoffSuffix)
    ? competitionId.slice(0, competitionId.length - playoffSuffix.length)
    : "";

  const knownPlayoff = leagueId
    ? simulationState?.seasonOutcomes?.leagues?.[leagueId]?.playoff ?? null
    : null;
  const homeTeamName = String(knownPlayoff?.homeTeamName ?? "").trim();
  const awayTeamName = String(knownPlayoff?.awayTeamName ?? "").trim();
  if (homeTeamName && awayTeamName) {
    return `${homeTeamName} v ${awayTeamName}`;
  }

  return normaliseOpponentTooltipText({
    opponentText: event?.opponent,
    isHome: event?.isHome,
  });
};

export const isCalendarMatchEvent = (event) => MATCH_EVENT_TYPES.includes(event?.type);

export const resolveCalendarEventVisual = (event) => {
  const competitionId = normaliseText(event?.competitionId);
  const eventType = event?.type;

  if (eventType === CALENDAR_EVENT_TYPES.LEAGUE_MATCH) {
    return CALENDAR_EVENT_VISUALS.leagueMatch;
  }

  if (eventType === CALENDAR_EVENT_TYPES.PLAYOFF_MATCH) {
    return CALENDAR_EVENT_VISUALS.playoff;
  }

  if (eventType === CALENDAR_EVENT_TYPES.CUP_DRAW) {
    return competitionId === "champions-cup"
      ? CALENDAR_EVENT_VISUALS.championsCupDraw
      : CALENDAR_EVENT_VISUALS.leagueCupDraw;
  }

  if (eventType === CALENDAR_EVENT_TYPES.FINAL) {
    return competitionId === "champions-cup"
      ? CALENDAR_EVENT_VISUALS.championsCupFinal
      : CALENDAR_EVENT_VISUALS.leagueCupFinal;
  }

  if (eventType === CALENDAR_EVENT_TYPES.CUP_MATCH) {
    return competitionId === "champions-cup"
      ? CALENDAR_EVENT_VISUALS.championsCupMatch
      : CALENDAR_EVENT_VISUALS.leagueCupMatch;
  }

  return CALENDAR_EVENT_VISUALS.leagueMatch;
};

export const resolveCalendarEventTooltip = ({
  event,
  dayAbsoluteDayIndex,
  simulationState,
  playerTeamId,
}) => {
  if (!isCalendarMatchEvent(event)) {
    return "";
  }

  if (event?.type === CALENDAR_EVENT_TYPES.PLAYOFF_MATCH) {
    return resolvePlayoffTooltip({
      event,
      simulationState,
    });
  }

  if (event?.type === CALENDAR_EVENT_TYPES.LEAGUE_MATCH) {
    return normaliseOpponentTooltipText({
      opponentText: event?.opponent,
      isHome: event?.isHome,
    });
  }

  const competitionId = normaliseText(event?.competitionId);
  if (!isCupCompetition(competitionId)) {
    return "";
  }

  if (event?.type === CALENDAR_EVENT_TYPES.FINAL) {
    const knownFinalFixture = resolveKnownCupFinalFixture({
      simulationState,
      competitionId,
    });
    if (knownFinalFixture) {
      return `${knownFinalFixture.homeTeamName} v ${knownFinalFixture.awayTeamName}`;
    }
  }

  const playerInCup = isPlayerInCupCompetition({
    simulationState,
    competitionId,
    playerTeamId,
  });
  if (!playerInCup) {
    return "";
  }

  const playerCupFixture = resolvePlayerCupFixtureForDay({
    simulationState,
    dayAbsoluteDayIndex,
    competitionId,
    playerTeamId,
  });
  const resolvedOpponentLabel = resolveOpponentLabel({
    fixture: playerCupFixture,
    playerTeamId,
  });
  if (resolvedOpponentLabel) {
    return resolvedOpponentLabel;
  }

  return normaliseOpponentTooltipText({
    opponentText: event?.opponent,
    isHome: event?.isHome,
  });
};
