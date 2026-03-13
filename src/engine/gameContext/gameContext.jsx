import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { createDefaultCareerCardState } from "../../game/cards/state/cardState";

/*
Usage:

import { GameProvider, useGame } from "@/engine/game/gameContext";

Read / write anywhere:
const { gameState, setGameValue, setGameState } = useGame();

setGameValue("ui.top", "red");
console.log(gameState.ui.top);
*/

const GameContext = createContext(null);

const DEFAULT_SHIRT = Object.freeze({
  pattern: "",
  mainColour: "",
  detailColour: "",
});

const DEFAULT_CAREER_SETUP = Object.freeze({
  teamName: "",
  teamStadium: "",
  homeKit: DEFAULT_SHIRT,
  awayKit: {
    pattern: "",
    mainColour: "",
    detailColour: "",
  },
  homeColour: "",
  awayColour: "",
  goalkeeperKit: "",
  players: [],
  teamSelector: {
    generatedAt: "",
    sessionId: "",
    currentChoiceIndex: 0,
    choiceGroups: [],
    goalkeeperPool: [],
    outfieldPool: [],
    outfieldDebugSummary: {
      overallCounts: {},
      influenceCounts: {},
    },
    selectedGoalkeeper: null,
    selectedOutfieldPlayers: [],
    isComplete: false,
  },
  coaches: [],
  coachSelector: {
    generatedAt: "",
    sessionId: "",
    choiceGroups: [],
    selectedByGroup: {},
    isComplete: false,
  },
  teamManagement: {
    version: 1,
    savedAt: "",
    goalkeeperId: null,
    slotAssignments: {
      "defender-1": null,
      "defender-2": null,
      "midfielder-1": null,
      "midfielder-2": null,
      "attacker-1": null,
      "attacker-2": null,
    },
    tactics: {
      defensiveWidth: "Normal",
      defensiveTactic: "Mid Block",
      attackingWidth: "Normal",
      attackingTactic: "Posession",
    },
    dtr: 0,
    atr: 0,
    tacticCompatibility: 0,
  },
});

const DEFAULT_CAREER_GENERATION_PROGRESS = Object.freeze({
  phase: "idle",
  phaseLabel: "Idle",
  detail: "",
  completedUnits: 0,
  totalUnits: 1,
  percent: 0,
  updatedAt: "",
});

const DEFAULT_CAREER_GENERATION = Object.freeze({
  status: "idle",
  error: "",
  startedAt: "",
  completedAt: "",
  progress: DEFAULT_CAREER_GENERATION_PROGRESS,
  completedCompetitionSummaries: [],
  debugEvents: [],
});

const DEFAULT_CAREER_WORLD = Object.freeze({
  generatedAt: "",
  playerTeam: null,
  competitions: [],
  domesticCompetitions: [],
  foreignCompetitions: [],
  totals: {
    competitionCount: 0,
    aiTeamCount: 0,
    aiPlayerCount: 0,
    aiManagerCount: 0,
  },
  debug: {
    teamOverallDistributionByCompetition: {},
    playerTargetSpreadByTeam: [],
    influenceDistribution: {
      totalOutfieldPlayers: 0,
      counts: {},
    },
    managerGeneration: {
      totals: {
        aiTeamCount: 0,
        managerCount: 0,
        missingManagers: 0,
        validManagers: 0,
        invalidManagers: 0,
        assignmentCoveragePercent: 0,
      },
      preferenceCountDistribution: {
        preferredDefensiveCounts: {},
        unpreferredDefensiveCounts: {},
        preferredAttackingCounts: {},
        unpreferredAttackingCounts: {},
      },
      managerAssignments: [],
    },
  },
});

const DEFAULT_CAREER_CALENDAR = Object.freeze({
  status: "idle",
  sourceGeneratedAt: "",
  seasons: [],
  activeSeasonId: "",
  currentDayIndex: 0,
  careerDayNumber: 0,
  visibleMonthIndex: 0,
  pendingFlashDayIndex: null,
  pendingDayResults: null,
  pendingCupDraw: null,
  seasonFixturesRevealed: false,
  lastAdvancedAt: "",
  championsCupStructure: {
    participants: [],
    groups: {},
    groupTables: {},
    quarterFinals: [],
    semiFinals: [],
    final: {},
  },
  simulation: {
    status: "ready",
    pendingPlayerFixtureId: "",
    teamFormByTeamId: {},
    playerStats: {
      byCompetition: {},
      leagueTablesByCompetition: {},
      cupTablesByCompetition: {},
    },
    league: {
      fixturesById: {},
      fixtureIdsByDay: {},
      tablesByCompetition: {},
      fixtureCount: 0,
      playerCalendarEvents: [],
    },
    cups: {
      fixturesById: {},
      fixtureIdsByDay: {},
      competitions: {
        leagueCup: {
          id: "league-cup",
          name: "League Cup",
          participants: [],
          championTeamId: "",
          stageOrder: [],
          stageMeta: {},
        },
        championsCup: {
          id: "champions-cup",
          name: "Champions Cup",
          participantTeamIds: [],
          groups: {},
          groupTables: {},
          championTeamId: "",
          groupWinners: {},
          groupRunnersUp: {},
          qualifiers: [],
          stageOrder: [],
          stageMeta: {},
        },
      },
    },
    seasonOutcomes: {
      resolved: false,
      resolvedAt: "",
      leagues: {},
    },
    debug: {
      latestDaySummary: null,
      recentDaySummaries: [],
      recentFixtureLogs: [],
      playerStatsSnapshot: {
        leagueTablesByCompetition: {},
        cupTablesByCompetition: {},
      },
    },
  },
  debug: {
    seasonShape: {
      totalMonths: 0,
      totalWeeks: 0,
      totalDays: 0,
    },
    eventTypeCounts: {},
    totals: {
      totalScheduledEvents: 0,
      leagueFixtures: 0,
      simulatedLeagueFixtures: 0,
      leagueCupEvents: 0,
      championsCupEvents: 0,
      playoffEvents: 0,
      leagueMatchesInCalendar: 0,
    },
    leagueFixturePreview: [],
    cupEventPreview: [],
    playoffPreview: [],
    simulation: {},
  },
});

const DEFAULT_CAREER_CARDS = Object.freeze(createDefaultCareerCardState());

const DEFAULT_GAME_STATE = Object.freeze({
  player: {
    health: 100,
    money: 0,
    progress: 0,
  },
  ui: {
    top: "red",
    mid: "green",
    right: "blue",
  },
  career: {
    setup: DEFAULT_CAREER_SETUP,
    generation: DEFAULT_CAREER_GENERATION,
    world: DEFAULT_CAREER_WORLD,
    calendar: DEFAULT_CAREER_CALENDAR,
    cards: DEFAULT_CAREER_CARDS,
  },
});

const setByPath = (obj, path, value) => {
  const keys = path.split(".");
  const next = { ...obj };

  let cursor = next;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (i === keys.length - 1) {
      cursor[key] = value;
    } else {
      const current = cursor[key];
      cursor[key] = typeof current === "object" && current !== null ? { ...current } : {};
      cursor = cursor[key];
    }
  }

  return next;
};

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(DEFAULT_GAME_STATE);

  // "POST" a single value by path, eg: setGameValue("player.health", 80)
  const setGameValue = useCallback((path, value) => {
    setGameState((prev) => setByPath(prev, path, value));
  }, []);

  const loadGameState = useCallback((nextState) => {
    if (nextState == null || typeof nextState !== "object") {
      throw new Error("loadGameState: nextState must be an object");
    }
    setGameState(nextState);
  }, []);

  const value = useMemo(
    () => ({
      gameState,
      setGameState,
      setGameValue,
      loadGameState,
    }),
    [gameState, setGameValue, loadGameState]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

GameProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return ctx;
};
