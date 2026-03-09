import { applyResultToCupGroupTable } from "./cupStandings";
import { randomInt } from "../../../engine/utils/rng/rng";
import {
  createChampionsCupFinalFixture,
  createChampionsCupQuarterFinalFixtures,
  createChampionsCupSemiFinalFixtures,
  createInitialCupSimulationState,
  createLeagueCupNextRoundFixtures,
} from "./cupSimulationState";
import { applyLeagueResultToTable } from "./leagueTable";
import { buildTeamLookup, createInitialLeagueSimulationState } from "./leagueSimulationState";
import {
  calculateTeamMatchRating,
  generateScorelineFromResolvedOutcome,
  generateScorelineFromSelectedResult,
  resolveMatchOutcomeTypeFromMatrix,
} from "./matchSimulation";
import { buildTeamMatchProfile } from "./teamMatchProfile";
import {
  appendTeamFormResult,
  createRandomTeamForm,
  normaliseTeamForm,
  resolveFormResultsFromScoreline,
} from "./teamForm";
import { generateMatchGoalEvents } from "./playerMatchEvents";
import { applyFixtureResultToPlayerStats, createInitialPlayerStatsState } from "./playerStats";
import { DAY_INDEX, FIXTURE_STATUS, FIXTURE_TYPES } from "../constants/simulationConstants";

const clone = (value) => JSON.parse(JSON.stringify(value));

const appendCapped = (items, nextItem, limit = 100) => [nextItem, ...items].slice(0, limit);
const toAbsoluteDayIndex = ({ weekNumber, dayOfWeek }) => (weekNumber - 1) * 7 + dayOfWeek;

const resolveChampionsDrawDay = (stageMeta) => {
  if (Number.isInteger(stageMeta?.drawWeekNumber) && Number.isInteger(stageMeta?.drawDayOfWeek)) {
    return {
      drawWeekNumber: stageMeta.drawWeekNumber,
      drawDayOfWeek: stageMeta.drawDayOfWeek,
    };
  }

  if (stageMeta?.stageKey === "group-md-1") {
    return {
      drawWeekNumber: 1,
      drawDayOfWeek: DAY_INDEX.MONDAY,
    };
  }

  if (!Number.isInteger(stageMeta?.weekNumber) || !Number.isInteger(stageMeta?.dayOfWeek)) {
    return {
      drawWeekNumber: null,
      drawDayOfWeek: null,
    };
  }

  const stageAbsoluteDayIndex = toAbsoluteDayIndex({
    weekNumber: stageMeta.weekNumber,
    dayOfWeek: stageMeta.dayOfWeek,
  });
  const daysFromThursday = (stageMeta.dayOfWeek - DAY_INDEX.THURSDAY + 7) % 7;
  const daysToSubtract = daysFromThursday === 0 ? 7 : daysFromThursday;
  const drawAbsoluteDayIndex = stageAbsoluteDayIndex - daysToSubtract;

  if (drawAbsoluteDayIndex < 0) {
    return {
      drawWeekNumber: null,
      drawDayOfWeek: null,
    };
  }

  return {
    drawWeekNumber: Math.floor(drawAbsoluteDayIndex / 7) + 1,
    drawDayOfWeek: drawAbsoluteDayIndex % 7,
  };
};

const buildInitialTeamFormByTeamId = ({ careerWorld, carryOverTeamFormByTeamId = {} }) => {
  const competitions = Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : [];
  const fromCarryOver = carryOverTeamFormByTeamId ?? {};

  const teamFormByTeamId = competitions.reduce((state, competition) => {
    (competition.teams ?? []).forEach((team) => {
      const carryOverForm = normaliseTeamForm(fromCarryOver[team.id]);
      const teamForm = normaliseTeamForm(team?.form);
      state[team.id] =
        carryOverForm.length > 0
          ? carryOverForm
          : teamForm.length > 0
          ? teamForm
          : competition.type === "foreign"
          ? createRandomTeamForm()
          : [];
    });
    return state;
  }, {});

  const playerTeamId = careerWorld?.playerTeam?.id ?? "";
  if (playerTeamId) {
    const carryOverPlayerForm = normaliseTeamForm(fromCarryOver[playerTeamId]);
    const playerForm = normaliseTeamForm(careerWorld?.playerTeam?.form);
    teamFormByTeamId[playerTeamId] =
      carryOverPlayerForm.length > 0 ? carryOverPlayerForm : playerForm.length > 0 ? playerForm : [];
  }

  return teamFormByTeamId;
};

const mergeTeamFormByTeamId = ({ existingTeamFormByTeamId, careerWorld }) => {
  const existing = existingTeamFormByTeamId ?? {};
  const seeded = buildInitialTeamFormByTeamId({
    careerWorld,
    carryOverTeamFormByTeamId: existing,
  });
  const merged = { ...seeded };

  Object.entries(existing).forEach(([teamId, formValue]) => {
    merged[teamId] = normaliseTeamForm(formValue);
  });

  return merged;
};

const applyFixtureResultToTeamForm = ({ simulationState, fixtureResult }) => {
  const homeTeamId = fixtureResult?.homeTeamId ?? "";
  const awayTeamId = fixtureResult?.awayTeamId ?? "";
  if (!homeTeamId || !awayTeamId) {
    return;
  }

  const currentMap = simulationState?.teamFormByTeamId ?? {};
  const { homeResult, awayResult } = resolveFormResultsFromScoreline({
    homeGoals: fixtureResult.homeGoals,
    awayGoals: fixtureResult.awayGoals,
  });

  simulationState.teamFormByTeamId = {
    ...currentMap,
    [homeTeamId]: appendTeamFormResult({
      existingForm: currentMap[homeTeamId],
      resultCode: homeResult,
    }),
    [awayTeamId]: appendTeamFormResult({
      existingForm: currentMap[awayTeamId],
      resultCode: awayResult,
    }),
  };
};

const getFixtureStoreByType = (simulationState, fixtureType) => {
  if (fixtureType === FIXTURE_TYPES.LEAGUE) {
    return simulationState.league.fixturesById;
  }
  return simulationState.cups.fixturesById;
};

const setFixtureStoreByType = (simulationState, fixtureType, fixturesById) => {
  if (fixtureType === FIXTURE_TYPES.LEAGUE) {
    simulationState.league.fixturesById = fixturesById;
  } else {
    simulationState.cups.fixturesById = fixturesById;
  }
};

const resolveFixtureWinnerTeamId = (fixtureResult) => {
  if (fixtureResult.winnerSide === "home") return fixtureResult.homeTeamId;
  if (fixtureResult.winnerSide === "away") return fixtureResult.awayTeamId;
  return fixtureResult.penaltyWinnerTeamId ?? "";
};

const forceCupKnockoutWinnerIfNeeded = ({ fixture, result }) => {
  const isLeagueCupKnockout = fixture.type === FIXTURE_TYPES.LEAGUE_CUP;
  const isChampionsKnockout =
    fixture.type === FIXTURE_TYPES.CHAMPIONS_CUP &&
    ["quarter-finals", "semi-finals", "final"].includes(fixture.stageKey);

  if (!isLeagueCupKnockout && !isChampionsKnockout) {
    return {
      ...result,
      penaltyWinnerTeamId: "",
      decidedBy: "normal",
    };
  }

  if (result.winnerSide !== "draw") {
    return {
      ...result,
      penaltyWinnerTeamId: "",
      decidedBy: "normal",
    };
  }

  const penaltyWinnerSide = randomInt(0, 1) === 0 ? "home" : "away";
  return {
    ...result,
    penaltyWinnerTeamId: penaltyWinnerSide === "home" ? fixture.homeTeamId : fixture.awayTeamId,
    decidedBy: "penalties",
  };
};

const resolveFixtureSimulationResult = ({
  fixture,
  simulationState,
  teamLookup,
  playerTeamId,
  forcedPlayerResult = null,
}) => {
  const homeTeam = teamLookup[fixture.homeTeamId];
  const awayTeam = teamLookup[fixture.awayTeamId];
  const teamFormByTeamId = simulationState?.teamFormByTeamId ?? {};
  const homeProfile = buildTeamMatchProfile({
    team: homeTeam,
    isPlayerTeam: fixture.homeTeamId === playerTeamId,
    teamForm: teamFormByTeamId[fixture.homeTeamId],
  });
  const awayProfile = buildTeamMatchProfile({
    team: awayTeam,
    isPlayerTeam: fixture.awayTeamId === playerTeamId,
    teamForm: teamFormByTeamId[fixture.awayTeamId],
  });
  const homeMatchRating = calculateTeamMatchRating(homeProfile);
  const awayMatchRating = calculateTeamMatchRating(awayProfile);

  let outcomeTypeData = resolveMatchOutcomeTypeFromMatrix({
    homeMatchRating,
    awayMatchRating,
    homeForm: homeProfile.form,
    awayForm: awayProfile.form,
  });
  let scoreline = generateScorelineFromResolvedOutcome({
    outcomeType: outcomeTypeData.outcomeType,
    higherRatedSide: outcomeTypeData.higherRatedSide,
    lowerRatedSide: outcomeTypeData.lowerRatedSide,
  });

  if (forcedPlayerResult) {
    scoreline = generateScorelineFromSelectedResult({
      selectedResult: forcedPlayerResult,
    });
    outcomeTypeData = {
      ...outcomeTypeData,
      outcomeType: forcedPlayerResult,
    };
  }

  const fixtureResult = forceCupKnockoutWinnerIfNeeded({
    fixture,
    result: {
      ...scoreline,
      goalEvents: generateMatchGoalEvents({
        fixtureId: fixture.id,
        homeTeam,
        awayTeam,
        homeGoals: scoreline.homeGoals,
        awayGoals: scoreline.awayGoals,
      }),
      homeTeamId: fixture.homeTeamId,
      awayTeamId: fixture.awayTeamId,
      homeTeamName: fixture.homeTeamName,
      awayTeamName: fixture.awayTeamName,
      winnerTeamId:
        scoreline.winnerSide === "home"
          ? fixture.homeTeamId
          : scoreline.winnerSide === "away"
          ? fixture.awayTeamId
          : "",
      playedAt: new Date().toISOString(),
    },
  });

  const winnerTeamId = resolveFixtureWinnerTeamId(fixtureResult);

  return {
    fixtureResult: {
      ...fixtureResult,
      winnerTeamId,
    },
    simulationDebug: {
      homeMatchRating,
      awayMatchRating,
      mrd: outcomeTypeData.mrd,
      mrdBandId: outcomeTypeData.mrdBandId,
      outcomeType: outcomeTypeData.outcomeType,
      higherRatedSide: outcomeTypeData.higherRatedSide,
      lowerRatedSide: outcomeTypeData.lowerRatedSide,
      probabilities: outcomeTypeData.probabilities,
      homeFormWins: outcomeTypeData.homeFormWins,
      awayFormWins: outcomeTypeData.awayFormWins,
      formWinDifference: outcomeTypeData.formWinDifference,
      formAdvantagedSide: outcomeTypeData.formAdvantagedSide,
      formWinBonusPercent: outcomeTypeData.formWinBonusPercent,
      homeAdvantageBonusPercent: outcomeTypeData.homeAdvantageBonusPercent,
      homeProfile,
      awayProfile,
      forcedPlayerResult: forcedPlayerResult ?? "",
    },
  };
};

const addFixtureToCupDayIndex = (simulationState, fixture) => {
  const dayKey = String(fixture.absoluteDayIndex);
  const existing = simulationState.cups.fixtureIdsByDay[dayKey] ?? [];
  simulationState.cups.fixtureIdsByDay[dayKey] = [...existing, fixture.id];
};

const createLeagueCupRoundIfNeeded = ({ simulationState, stageKey, teamLookup }) => {
  const leagueCup = simulationState.cups.competitions.leagueCup;
  const stageMeta = leagueCup.stageMeta[stageKey];
  if (!stageMeta || stageMeta.fixtureIds.length > 0) {
    return [];
  }

  const previousStageOrder = leagueCup.stageOrder;
  const stageIndex = previousStageOrder.indexOf(stageKey);
  const previousStageKey = stageIndex > 0 ? previousStageOrder[stageIndex - 1] : "";
  const previousWinners = leagueCup.stageMeta[previousStageKey]?.winnerTeamIds ?? [];
  if (previousWinners.length < 2) {
    return [];
  }

  const nextFixtures = createLeagueCupNextRoundFixtures({
    stageKey,
    participantTeamIds: previousWinners,
    teamLookup,
  });

  nextFixtures.forEach((fixture) => {
    simulationState.cups.fixturesById[fixture.id] = fixture;
    addFixtureToCupDayIndex(simulationState, fixture);
  });

  stageMeta.fixtureIds = nextFixtures.map((fixture) => fixture.id);
  return nextFixtures;
};

const resolveLeagueCupStageWinners = ({ simulationState, stageKey }) => {
  const leagueCup = simulationState.cups.competitions.leagueCup;
  const stageMeta = leagueCup.stageMeta[stageKey];
  if (!stageMeta || stageMeta.fixtureIds.length === 0) {
    return;
  }

  const allComplete = stageMeta.fixtureIds.every(
    (fixtureId) => simulationState.cups.fixturesById[fixtureId]?.status === FIXTURE_STATUS.COMPLETED
  );
  if (!allComplete) {
    return;
  }

  stageMeta.winnerTeamIds = stageMeta.fixtureIds
    .map((fixtureId) => simulationState.cups.fixturesById[fixtureId]?.result?.winnerTeamId)
    .filter(Boolean);

  if (stageKey === "final" && stageMeta.winnerTeamIds.length > 0) {
    leagueCup.championTeamId = stageMeta.winnerTeamIds[0];
  }
};

const resolveChampionsGroupQualifiersIfReady = (simulationState) => {
  const championsCup = simulationState.cups.competitions.championsCup;
  const groupStageFixtureIds = championsCup.stageMeta["group-md-3"]?.fixtureIds ?? [];
  const groupStageComplete = groupStageFixtureIds.every(
    (fixtureId) => simulationState.cups.fixturesById[fixtureId]?.status === FIXTURE_STATUS.COMPLETED
  );

  if (!groupStageComplete || championsCup.qualifiers.length > 0) {
    return;
  }

  const winnersByGroup = {};
  const runnersUpByGroup = {};
  Object.entries(championsCup.groupTables).forEach(([groupId, entries]) => {
    const sortedEntries = [...entries].sort((leftEntry, rightEntry) => {
      if (rightEntry.points !== leftEntry.points) return rightEntry.points - leftEntry.points;
      if (rightEntry.goalDifference !== leftEntry.goalDifference) {
        return rightEntry.goalDifference - leftEntry.goalDifference;
      }
      if (rightEntry.goalsFor !== leftEntry.goalsFor) return rightEntry.goalsFor - leftEntry.goalsFor;
      return String(leftEntry.teamName).localeCompare(String(rightEntry.teamName));
    });
    winnersByGroup[groupId] = sortedEntries[0]?.teamId ?? "";
    runnersUpByGroup[groupId] = sortedEntries[1]?.teamId ?? "";
  });

  championsCup.groupWinners = winnersByGroup;
  championsCup.groupRunnersUp = runnersUpByGroup;
  championsCup.qualifiers = [
    winnersByGroup.A,
    winnersByGroup.B,
    winnersByGroup.C,
    winnersByGroup.D,
    runnersUpByGroup.A,
    runnersUpByGroup.B,
    runnersUpByGroup.C,
    runnersUpByGroup.D,
  ].filter(Boolean);
};

const createChampionsKnockoutFixturesIfNeeded = ({ simulationState, stageKey, teamLookup }) => {
  const championsCup = simulationState.cups.competitions.championsCup;
  const stageMeta = championsCup.stageMeta[stageKey];
  if (!stageMeta || stageMeta.fixtureIds.length > 0) {
    return;
  }

  if (stageKey === "quarter-finals") {
    if (Object.keys(championsCup.groupWinners).length === 0) {
      return;
    }
    const fixtures = createChampionsCupQuarterFinalFixtures({
      winnersByGroup: championsCup.groupWinners,
      runnersUpByGroup: championsCup.groupRunnersUp,
      teamLookup,
    });
    fixtures.forEach((fixture) => {
      simulationState.cups.fixturesById[fixture.id] = fixture;
      addFixtureToCupDayIndex(simulationState, fixture);
    });
    stageMeta.fixtureIds = fixtures.map((fixture) => fixture.id);
    return fixtures;
  }

  if (stageKey === "semi-finals") {
    const qfWinnerIds = (championsCup.stageMeta["quarter-finals"]?.fixtureIds ?? [])
      .map((fixtureId) => simulationState.cups.fixturesById[fixtureId]?.result?.winnerTeamId)
      .filter(Boolean);
    if (qfWinnerIds.length < 4) {
      return;
    }
    const fixtures = createChampionsCupSemiFinalFixtures({
      winnerTeamIds: qfWinnerIds,
      teamLookup,
    });
    fixtures.forEach((fixture) => {
      simulationState.cups.fixturesById[fixture.id] = fixture;
      addFixtureToCupDayIndex(simulationState, fixture);
    });
    stageMeta.fixtureIds = fixtures.map((fixture) => fixture.id);
    return fixtures;
  }

  if (stageKey === "final") {
    const sfWinnerIds = (championsCup.stageMeta["semi-finals"]?.fixtureIds ?? [])
      .map((fixtureId) => simulationState.cups.fixturesById[fixtureId]?.result?.winnerTeamId)
      .filter(Boolean);
    if (sfWinnerIds.length < 2) {
      return;
    }
    const finalFixture = createChampionsCupFinalFixture({
      winnerTeamIds: sfWinnerIds,
      teamLookup,
    });
    if (!finalFixture) {
      return;
    }
    simulationState.cups.fixturesById[finalFixture.id] = finalFixture;
    addFixtureToCupDayIndex(simulationState, finalFixture);
    stageMeta.fixtureIds = [finalFixture.id];
    return [finalFixture];
  }

  return [];
};

const buildChampionsGroupDrawFixtures = ({ championsCup, teamLookup }) =>
  Object.entries(championsCup?.groups ?? {})
    .sort(([leftGroupId], [rightGroupId]) => String(leftGroupId).localeCompare(String(rightGroupId)))
    .map(([groupId, teamIds]) => ({
      fixtureId: `champions-cup-group-draw-${String(groupId).toLowerCase()}`,
      displayLabel: `Group ${groupId}: ${teamIds
        .map((teamId) => teamLookup[teamId]?.teamName ?? teamId)
        .join(", ")}`,
    }));

const finalizeChampionsCupChampionIfReady = (simulationState) => {
  const championsCup = simulationState.cups.competitions.championsCup;
  const finalFixtureId = championsCup.stageMeta.final?.fixtureIds?.[0] ?? "";
  if (!finalFixtureId) {
    return;
  }
  const finalFixture = simulationState.cups.fixturesById[finalFixtureId];
  if (finalFixture?.status !== FIXTURE_STATUS.COMPLETED) {
    return;
  }
  championsCup.championTeamId = finalFixture?.result?.winnerTeamId ?? "";
};

const simulatePlayoffFixture = ({
  homeTeamId,
  awayTeamId,
  simulationState,
  teamLookup,
  playerTeamId,
}) => {
  const fixture = {
    id: `playoff-${homeTeamId}-vs-${awayTeamId}`,
    type: FIXTURE_TYPES.PLAYOFF,
    homeTeamId,
    awayTeamId,
    homeTeamName: teamLookup[homeTeamId]?.teamName ?? homeTeamId,
    awayTeamName: teamLookup[awayTeamId]?.teamName ?? awayTeamId,
    stageKey: "playoff",
  };
  const fixtureResult = resolveFixtureSimulationResult({
    fixture,
    simulationState,
    teamLookup,
    playerTeamId,
  }).fixtureResult;

  applyFixtureResultToTeamForm({
    simulationState,
    fixtureResult,
  });

  return fixtureResult;
};

const resolveSeasonOutcomesIfReady = ({ simulationState, teamLookup, playerTeamId }) => {
  if (simulationState.seasonOutcomes?.resolved) {
    return;
  }

  const allLeagueFixtures = Object.values(simulationState.league.fixturesById);
  const allLeagueComplete = allLeagueFixtures.every((fixture) => fixture.status === FIXTURE_STATUS.COMPLETED);
  if (!allLeagueComplete) {
    return;
  }

  const tables = simulationState.league.tablesByCompetition;
  const getTable = (competitionId) => tables?.[competitionId]?.entries ?? [];
  const league5 = getTable("league-5");
  const league4 = getTable("league-4");
  const league3 = getTable("league-3");
  const league2 = getTable("league-2");
  const league1 = getTable("league-1");

  const playoff5 = simulatePlayoffFixture({
    homeTeamId: league5[1]?.teamId,
    awayTeamId: league5[2]?.teamId,
    simulationState,
    teamLookup,
    playerTeamId,
  });
  const playoff4 = simulatePlayoffFixture({
    homeTeamId: league4[1]?.teamId,
    awayTeamId: league4[2]?.teamId,
    simulationState,
    teamLookup,
    playerTeamId,
  });
  const playoff3 = simulatePlayoffFixture({
    homeTeamId: league3[1]?.teamId,
    awayTeamId: league3[2]?.teamId,
    simulationState,
    teamLookup,
    playerTeamId,
  });
  const playoff2 = simulatePlayoffFixture({
    homeTeamId: league2[1]?.teamId,
    awayTeamId: league2[2]?.teamId,
    simulationState,
    teamLookup,
    playerTeamId,
  });

  simulationState.seasonOutcomes = {
    resolved: true,
    resolvedAt: new Date().toISOString(),
    leagues: {
      "league-5": {
        promoted: [league5[0]?.teamId ?? "", playoff5.winnerTeamId].filter(Boolean),
        playoff: playoff5,
      },
      "league-4": {
        promoted: [league4[0]?.teamId ?? "", playoff4.winnerTeamId].filter(Boolean),
        relegated: [league4[league4.length - 2]?.teamId, league4[league4.length - 1]?.teamId].filter(Boolean),
        playoff: playoff4,
      },
      "league-3": {
        promoted: [league3[0]?.teamId ?? "", playoff3.winnerTeamId].filter(Boolean),
        relegated: [league3[league3.length - 2]?.teamId, league3[league3.length - 1]?.teamId].filter(Boolean),
        playoff: playoff3,
      },
      "league-2": {
        promoted: [league2[0]?.teamId ?? "", playoff2.winnerTeamId].filter(Boolean),
        relegated: [league2[league2.length - 2]?.teamId, league2[league2.length - 1]?.teamId].filter(Boolean),
        playoff: playoff2,
      },
      "league-1": {
        relegated: [league1[league1.length - 2]?.teamId, league1[league1.length - 1]?.teamId].filter(Boolean),
        championsCupQualifiers: league1.slice(0, 4).map((entry) => entry.teamId),
      },
    },
  };
};

export const buildInitialCareerSimulationState = ({
  careerWorld,
  carryOverTeamFormByTeamId = {},
}) => {
  const leagueState = createInitialLeagueSimulationState({ careerWorld });
  const cupState = createInitialCupSimulationState({
    careerWorld,
    teamLookup: leagueState.teamLookup,
  });
  const teamFormByTeamId = buildInitialTeamFormByTeamId({
    careerWorld,
    carryOverTeamFormByTeamId,
  });

  return {
    status: "ready",
    pendingPlayerFixtureId: "",
    teamFormByTeamId,
    playerStats: createInitialPlayerStatsState({
      careerWorld,
    }),
    league: {
      fixturesById: leagueState.fixturesById,
      fixtureIdsByDay: leagueState.fixtureIdsByDay,
      tablesByCompetition: leagueState.tablesByCompetition,
      fixtureCount: leagueState.fixtureCount,
      playerCalendarEvents: leagueState.playerCalendarEvents,
    },
    cups: cupState,
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
  };
};

export const getSimulationFixtureById = ({ simulationState, fixtureId }) => {
  if (!fixtureId) {
    return null;
  }
  return (
    simulationState?.league?.fixturesById?.[fixtureId] ??
    simulationState?.cups?.fixturesById?.[fixtureId] ??
    null
  );
};

const applyFixtureResultToState = ({
  simulationState,
  fixture,
  fixtureResult,
  simulationDebug,
  teamLookup,
}) => {
  const fixtureStore = clone(getFixtureStoreByType(simulationState, fixture.type));
  fixtureStore[fixture.id] = {
    ...fixture,
    status: FIXTURE_STATUS.COMPLETED,
    result: fixtureResult,
    simulation: simulationDebug,
  };
  setFixtureStoreByType(simulationState, fixture.type, fixtureStore);
  applyFixtureResultToTeamForm({
    simulationState,
    fixtureResult,
  });

  if (fixture.type === FIXTURE_TYPES.LEAGUE) {
    const table = simulationState.league.tablesByCompetition[fixture.competitionId];
    if (table) {
      simulationState.league.tablesByCompetition[fixture.competitionId] = applyLeagueResultToTable({
        table,
        fixtureResult,
      });
    }
  }

  if (fixture.type === FIXTURE_TYPES.CHAMPIONS_CUP && fixture.groupId) {
    const groupEntries = simulationState.cups.competitions.championsCup.groupTables[fixture.groupId] ?? [];
    simulationState.cups.competitions.championsCup.groupTables[fixture.groupId] = applyResultToCupGroupTable({
      tableEntries: groupEntries,
      homeTeamId: fixture.homeTeamId,
      awayTeamId: fixture.awayTeamId,
      homeGoals: fixtureResult.homeGoals,
      awayGoals: fixtureResult.awayGoals,
    });
  }

  simulationState.playerStats = applyFixtureResultToPlayerStats({
    playerStatsState: simulationState.playerStats,
    fixture,
    fixtureResult,
    teamLookup,
  });
};

const processDrawDays = ({ simulationState, currentDay, teamLookup }) => {
  const createdCupDraws = [];
  const leagueCup = simulationState.cups.competitions.leagueCup;
  leagueCup.stageOrder.forEach((stageKey) => {
    const stageMeta = leagueCup.stageMeta[stageKey];
    if (!stageMeta) {
      return;
    }
    if (stageMeta.drawWeekNumber !== currentDay.seasonWeekNumber || stageMeta.drawDayOfWeek !== currentDay.dayOfWeek) {
      return;
    }
    if (stageKey === "round-1") {
      const fixtures = stageMeta.fixtureIds
        .map((fixtureId) => simulationState.cups.fixturesById[fixtureId])
        .filter(Boolean);

      if (fixtures.length > 0) {
        createdCupDraws.push({
          id: `draw-league-cup-${stageKey}`,
          competitionId: "league-cup",
          competitionName: "League Cup",
          stageKey,
          stageLabel: `${fixtures[0]?.stageLabel ?? stageKey} Draw`,
          fixtures: fixtures.map((fixture) => ({
            fixtureId: fixture.id,
            homeTeamId: fixture.homeTeamId,
            awayTeamId: fixture.awayTeamId,
            homeTeamName: fixture.homeTeamName,
            awayTeamName: fixture.awayTeamName,
          })),
        });
      }
    } else {
      const createdFixtures = createLeagueCupRoundIfNeeded({
        simulationState,
        stageKey,
        teamLookup,
      }) ?? [];

      if (createdFixtures.length > 0) {
        createdCupDraws.push({
          id: `draw-league-cup-${stageKey}`,
          competitionId: "league-cup",
          competitionName: "League Cup",
          stageKey,
          stageLabel: createdFixtures[0]?.stageLabel ?? stageKey,
          fixtures: createdFixtures.map((fixture) => ({
            fixtureId: fixture.id,
            homeTeamId: fixture.homeTeamId,
            awayTeamId: fixture.awayTeamId,
            homeTeamName: fixture.homeTeamName,
            awayTeamName: fixture.awayTeamName,
          })),
        });
      }
    }
  });

  const championsCup = simulationState.cups.competitions.championsCup;
  championsCup.stageOrder.forEach((stageKey) => {
    const stageMeta = championsCup.stageMeta[stageKey];
    if (!stageMeta) {
      return;
    }

    const { drawWeekNumber, drawDayOfWeek } = resolveChampionsDrawDay(stageMeta);
    if (drawWeekNumber !== currentDay.seasonWeekNumber || drawDayOfWeek !== currentDay.dayOfWeek) {
      return;
    }

    if (stageKey === "group-md-1") {
      const groupDrawFixtures = buildChampionsGroupDrawFixtures({
        championsCup,
        teamLookup,
      });
      if (groupDrawFixtures.length > 0) {
        createdCupDraws.push({
          id: "draw-champions-cup-groups",
          competitionId: "champions-cup",
          competitionName: "Champions Cup",
          stageKey,
          stageLabel: stageMeta.drawStageLabel || "Group Draw",
          fixtures: groupDrawFixtures,
        });
      }
      return;
    }

    if (!["quarter-finals", "semi-finals", "final"].includes(stageKey)) {
      return;
    }

    const createdFixtures = createChampionsKnockoutFixturesIfNeeded({
      simulationState,
      stageKey,
      teamLookup,
    }) ?? [];

    if (createdFixtures.length > 0) {
      createdCupDraws.push({
        id: `draw-champions-cup-${stageKey}`,
        competitionId: "champions-cup",
        competitionName: "Champions Cup",
        stageKey,
        stageLabel: stageMeta.drawStageLabel || `${createdFixtures[0]?.stageLabel ?? stageKey} Draw`,
        fixtures: createdFixtures.map((fixture) => ({
          fixtureId: fixture.id,
          homeTeamId: fixture.homeTeamId,
          awayTeamId: fixture.awayTeamId,
          homeTeamName: fixture.homeTeamName,
          awayTeamName: fixture.awayTeamName,
        })),
      });
    }
  });

  return createdCupDraws;
};

export const simulateCareerDay = ({
  simulationState,
  careerWorld,
  currentDay,
  forcedPlayerResolution = null,
}) => {
  const nextSimulationState = clone(simulationState);
  const playerTeamId = careerWorld?.playerTeam?.id ?? "";
  const teamLookup = buildTeamLookup({ careerWorld });
  nextSimulationState.teamFormByTeamId = mergeTeamFormByTeamId({
    existingTeamFormByTeamId: nextSimulationState.teamFormByTeamId,
    careerWorld,
  });
  if (!nextSimulationState.playerStats) {
    nextSimulationState.playerStats = createInitialPlayerStatsState({
      careerWorld,
    });
  }

  const createdCupDraws = processDrawDays({
    simulationState: nextSimulationState,
    currentDay,
    teamLookup,
  });

  const dayKey = String(currentDay.absoluteDayIndex);
  const dayLeagueFixtureIds = nextSimulationState.league.fixtureIdsByDay[dayKey] ?? [];
  const dayCupFixtureIds = nextSimulationState.cups.fixtureIdsByDay[dayKey] ?? [];
  const allDayFixtureIds = [...dayLeagueFixtureIds, ...dayCupFixtureIds];
  const resolvedFixtureIds = [];
  let pendingPlayerFixtureId = "";

  allDayFixtureIds.forEach((fixtureId) => {
    const fixture = getSimulationFixtureById({
      simulationState: nextSimulationState,
      fixtureId,
    });

    if (!fixture || fixture.status === FIXTURE_STATUS.COMPLETED) {
      return;
    }

    const includesPlayer = fixture.homeTeamId === playerTeamId || fixture.awayTeamId === playerTeamId;
    const isForcedPlayerFixture = forcedPlayerResolution?.fixtureId === fixture.id;
    if (includesPlayer && !isForcedPlayerFixture) {
      pendingPlayerFixtureId = fixture.id;
      return;
    }

    const resolved = resolveFixtureSimulationResult({
      fixture,
      simulationState: nextSimulationState,
      teamLookup,
      playerTeamId,
      forcedPlayerResult: isForcedPlayerFixture ? forcedPlayerResolution?.selectedResult : null,
    });

    applyFixtureResultToState({
      simulationState: nextSimulationState,
      fixture,
      fixtureResult: resolved.fixtureResult,
      simulationDebug: resolved.simulationDebug,
      teamLookup,
    });
    resolvedFixtureIds.push(fixture.id);

    nextSimulationState.debug.recentFixtureLogs = appendCapped(
      nextSimulationState.debug.recentFixtureLogs,
      {
        fixtureId: fixture.id,
        type: fixture.type,
        competitionName: fixture.competitionName,
        stageLabel: fixture.stageLabel,
        homeTeamName: fixture.homeTeamName,
        awayTeamName: fixture.awayTeamName,
        result: resolved.fixtureResult,
        simulation: resolved.simulationDebug,
      },
      160
    );
  });

  const leagueCup = nextSimulationState.cups.competitions.leagueCup;
  leagueCup.stageOrder.forEach((stageKey) => {
    resolveLeagueCupStageWinners({
      simulationState: nextSimulationState,
      stageKey,
    });
  });

  resolveChampionsGroupQualifiersIfReady(nextSimulationState);
  finalizeChampionsCupChampionIfReady(nextSimulationState);
  resolveSeasonOutcomesIfReady({
    simulationState: nextSimulationState,
    teamLookup,
    playerTeamId,
  });

  nextSimulationState.pendingPlayerFixtureId = pendingPlayerFixtureId;
  nextSimulationState.debug.latestDaySummary = {
    dayOfSeason: currentDay.dayOfSeason,
    seasonWeekNumber: currentDay.seasonWeekNumber,
    dayName: currentDay.dayName,
    fixtureCount: allDayFixtureIds.length,
    resolvedFixtureIds,
    pendingPlayerFixtureId,
  };
  nextSimulationState.debug.recentDaySummaries = appendCapped(
    nextSimulationState.debug.recentDaySummaries,
    nextSimulationState.debug.latestDaySummary,
    40
  );
  nextSimulationState.debug.playerStatsSnapshot = {
    leagueTablesByCompetition: nextSimulationState?.playerStats?.leagueTablesByCompetition ?? {},
    cupTablesByCompetition: nextSimulationState?.playerStats?.cupTablesByCompetition ?? {},
  };

  return {
    nextSimulationState,
    pendingPlayerFixtureId,
    resolvedFixtureIds,
    createdCupDraws,
  };
};
